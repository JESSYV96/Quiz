import { GameStateService } from './game-state.service';
import { Difficulty } from '@jessy/domain';

// Mock ioredis : on simule Redis avec un simple Map en memoire.
// Ca permet de tester la logique metier sans lancer Redis.
const mockStore = new Map<string, string>();

jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => ({
    get: jest.fn((key: string) => Promise.resolve(mockStore.get(key) || null)),
    set: jest.fn(
      (key: string, value: string, _ex?: string, _ttl?: number) => {
        mockStore.set(key, value);
        return Promise.resolve('OK');
      },
    ),
    del: jest.fn((...keys: string[]) => {
      let count = 0;
      for (const key of keys) {
        if (mockStore.delete(key)) count++;
      }
      return Promise.resolve(count);
    }),
    keys: jest.fn((pattern: string) => {
      const prefix = pattern.replace('*', '');
      const matching = [...mockStore.keys()].filter((k) =>
        k.startsWith(prefix),
      );
      return Promise.resolve(matching);
    }),
  }));
  return { __esModule: true, default: MockRedis };
});

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    mockStore.clear();
    service = new GameStateService();
  });

  describe('Session management', () => {
    it('should create a session in lobby status with admin as first player', async () => {
      await service.createSession('room1', 'admin-socket');
      const session = await service.getSession('room1');

      expect(session).toBeDefined();
      expect(session.status).toBe('lobby');
      expect(session.adminId).toBe('admin-socket');
      expect(session.players.size).toBe(1);
      expect(session.players.get('admin-socket')).toEqual({
        id: 'admin-socket',
        score: 0,
        hasAnswered: false,
      });
    });

    it('should add a player with score 0', async () => {
      await service.createSession('room1', 'admin');
      await service.addPlayer('room1', 'player2');

      const session = await service.getSession('room1');
      expect(session.players.size).toBe(2);
      expect(session.players.get('player2')).toEqual({
        id: 'player2',
        score: 0,
        hasAnswered: false,
      });
    });

    it('should remove a player from the session', async () => {
      await service.createSession('room1', 'admin');
      await service.addPlayer('room1', 'player2');
      await service.removePlayer('room1', 'player2');

      const session = await service.getSession('room1');
      expect(session.players.size).toBe(1);
      expect(session.players.has('player2')).toBe(false);
    });

    it('should delete session when last player is removed', async () => {
      await service.createSession('room1', 'admin');
      const result = await service.removePlayer('room1', 'admin');

      expect(result.sessionDeleted).toBe(true);
      expect(await service.getSession('room1')).toBeUndefined();
    });

    it('should delete a session', async () => {
      await service.createSession('room1', 'admin');
      await service.deleteSession('room1');

      expect(await service.getSession('room1')).toBeUndefined();
    });

    it('should find room by socket id via index', async () => {
      await service.createSession('room1', 'admin-socket');
      const room = await service.findRoomBySocketId('admin-socket');
      expect(room).toBe('room1');
    });

    it('should return undefined for unknown socket id', async () => {
      const room = await service.findRoomBySocketId('unknown');
      expect(room).toBeUndefined();
    });
  });

  describe('Answer submission', () => {
    beforeEach(async () => {
      await service.createSession('room1', 'player1');
      await service.addPlayer('room1', 'player2');

      // Manuellement passer la session en in-progress avec des questions
      const session = await service.getSession('room1');
      session.status = 'in-progress';
      session.questions = [
        {
          label: 'Question 1',
          type: 'multiple_choice',
          difficulty: Difficulty.Easy,
          theme: 'Sports',
          incorrectAnswers: ['B', 'C', 'D'],
          correctAnswer: 'A',
        },
      ];
      session.currentQuestionIndex = 0;
      // Sauvegarder directement dans le mock store
      mockStore.set(
        'quiz:session:room1',
        JSON.stringify({
          ...session,
          players: Object.fromEntries(session.players),
          answersReceived: Object.fromEntries(session.answersReceived),
        }),
      );
    });

    it('should record an answer and return allAnswered=false when not all answered', async () => {
      const result = await service.submitAnswer('room1', 'player1', 'A');
      expect(result.allAnswered).toBe(false);
    });

    it('should return allAnswered=true when all players have answered', async () => {
      await service.submitAnswer('room1', 'player1', 'A');
      const result = await service.submitAnswer('room1', 'player2', 'B');
      expect(result.allAnswered).toBe(true);
    });

    it('should ignore duplicate answer from the same player', async () => {
      await service.submitAnswer('room1', 'player1', 'A');
      const result = await service.submitAnswer('room1', 'player1', 'B');

      expect(result.allAnswered).toBe(false);
      const session = await service.getSession('room1');
      expect(session.answersReceived.get('player1')).toBe('A');
    });
  });

  describe('Question evaluation', () => {
    beforeEach(async () => {
      await service.createSession('room1', 'player1');
      await service.addPlayer('room1', 'player2');

      const session = await service.getSession('room1');
      session.status = 'in-progress';
      session.questions = [
        {
          label: 'Q1',
          type: 'multiple_choice',
          difficulty: Difficulty.Easy,
          theme: 'Sports',
          incorrectAnswers: ['B', 'C', 'D'],
          correctAnswer: 'A',
        },
        {
          label: 'Q2',
          type: 'multiple_choice',
          difficulty: Difficulty.Easy,
          theme: 'Sports',
          incorrectAnswers: ['X', 'Y', 'Z'],
          correctAnswer: 'W',
        },
      ];
      session.currentQuestionIndex = 0;
      mockStore.set(
        'quiz:session:room1',
        JSON.stringify({
          ...session,
          players: Object.fromEntries(session.players),
          answersReceived: Object.fromEntries(session.answersReceived),
        }),
      );
    });

    it('should give +10 for correct answer', async () => {
      await service.submitAnswer('room1', 'player1', 'A');
      await service.submitAnswer('room1', 'player2', 'B');
      const result = await service.evaluateQuestion('room1');

      expect(result.correctAnswer).toBe('A');
      const p1 = result.players.find((p) => p.id === 'player1');
      const p2 = result.players.find((p) => p.id === 'player2');
      expect(p1.score).toBe(10);
      expect(p2.score).toBe(0);
    });

    it('should give -5 for wrong answer when score >= 5', async () => {
      // Donner un score initial de 10 a player2
      const session = await service.getSession('room1');
      session.players.get('player2').score = 10;
      mockStore.set(
        'quiz:session:room1',
        JSON.stringify({
          ...session,
          players: Object.fromEntries(session.players),
          answersReceived: Object.fromEntries(session.answersReceived),
        }),
      );

      await service.submitAnswer('room1', 'player1', 'A');
      await service.submitAnswer('room1', 'player2', 'B');
      const result = await service.evaluateQuestion('room1');

      const p2 = result.players.find((p) => p.id === 'player2');
      expect(p2.score).toBe(5);
    });

    it('should not go below 0 for wrong answer when score < 5', async () => {
      await service.submitAnswer('room1', 'player1', 'B');
      await service.submitAnswer('room1', 'player2', 'C');
      const result = await service.evaluateQuestion('room1');

      const p1 = result.players.find((p) => p.id === 'player1');
      expect(p1.score).toBe(0);
    });

    it('should not penalize a player who did not answer (timeout)', async () => {
      await service.submitAnswer('room1', 'player1', 'A');
      const result = await service.evaluateQuestion('room1');

      const p2 = result.players.find((p) => p.id === 'player2');
      expect(p2.score).toBe(0);
    });
  });

  describe('Question progression', () => {
    beforeEach(async () => {
      await service.createSession('room1', 'player1');

      const session = await service.getSession('room1');
      session.status = 'in-progress';
      session.questions = [
        {
          label: 'Q1',
          type: 'multiple_choice',
          difficulty: Difficulty.Easy,
          theme: 'Sports',
          incorrectAnswers: ['B', 'C', 'D'],
          correctAnswer: 'A',
        },
        {
          label: 'Q2',
          type: 'multiple_choice',
          difficulty: Difficulty.Easy,
          theme: 'Sports',
          incorrectAnswers: ['X', 'Y', 'Z'],
          correctAnswer: 'W',
        },
      ];
      session.currentQuestionIndex = 0;
      mockStore.set(
        'quiz:session:room1',
        JSON.stringify({
          ...session,
          players: Object.fromEntries(session.players),
          answersReceived: Object.fromEntries(session.answersReceived),
        }),
      );
    });

    it('should advance to next question and reset answers', async () => {
      await service.submitAnswer('room1', 'player1', 'A');
      const next = await service.advanceQuestion('room1');

      expect(next).not.toBeNull();
      expect(next.questionIndex).toBe(1);
      expect(next.question.label).toBe('Q2');

      const session = await service.getSession('room1');
      expect(session.answersReceived.size).toBe(0);
    });

    it('should return null when advancing past last question', async () => {
      await service.advanceQuestion('room1'); // go to Q2
      const next = await service.advanceQuestion('room1'); // past end

      expect(next).toBeNull();
      const session = await service.getSession('room1');
      expect(session.status).toBe('finished');
    });
  });

  describe('Client question', () => {
    it('should return question without correctAnswer', async () => {
      await service.createSession('room1', 'player1');
      const session = await service.getSession('room1');
      session.status = 'in-progress';
      session.questions = [
        {
          label: 'Q1',
          type: 'multiple_choice',
          difficulty: Difficulty.Easy,
          theme: 'Sports',
          incorrectAnswers: ['B', 'C', 'D'],
          correctAnswer: 'A',
        },
      ];
      session.currentQuestionIndex = 0;
      mockStore.set(
        'quiz:session:room1',
        JSON.stringify({
          ...session,
          players: Object.fromEntries(session.players),
          answersReceived: Object.fromEntries(session.answersReceived),
        }),
      );

      const payload = await service.getClientQuestion('room1');

      expect(payload.question.label).toBe('Q1');
      expect((payload.question as any).correctAnswer).toBeUndefined();
      expect(payload.question.answers).toHaveLength(4);
      expect(payload.question.answers).toContain('A');
    });
  });

  describe('Active lobbies', () => {
    it('should only return sessions in lobby status', async () => {
      await service.createSession('lobby-room', 'p1');
      await service.createSession('playing-room', 'p2');

      // Passer playing-room en in-progress
      const session = await service.getSession('playing-room');
      session.status = 'in-progress';
      mockStore.set(
        'quiz:session:playing-room',
        JSON.stringify({
          ...session,
          players: Object.fromEntries(session.players),
          answersReceived: Object.fromEntries(session.answersReceived),
        }),
      );

      const lobbies = await service.getActiveLobbies();
      expect(lobbies).toHaveLength(1);
      expect(lobbies[0].name).toBe('lobby-room');
    });
  });

  describe('Disconnect during game', () => {
    it('should detect allAnswered when disconnected player had not answered', async () => {
      await service.createSession('room1', 'player1');
      await service.addPlayer('room1', 'player2');

      const session = await service.getSession('room1');
      session.status = 'in-progress';
      session.questions = [
        {
          label: 'Q1',
          type: 'multiple_choice',
          difficulty: Difficulty.Easy,
          theme: 'Sports',
          incorrectAnswers: ['B', 'C', 'D'],
          correctAnswer: 'A',
        },
      ];
      session.currentQuestionIndex = 0;
      mockStore.set(
        'quiz:session:room1',
        JSON.stringify({
          ...session,
          players: Object.fromEntries(session.players),
          answersReceived: Object.fromEntries(session.answersReceived),
        }),
      );

      await service.submitAnswer('room1', 'player1', 'A');
      const result = await service.removePlayer('room1', 'player2');

      expect(result.allAnswered).toBe(true);
      expect(result.sessionDeleted).toBe(false);
    });
  });

  describe('Game over', () => {
    it('should return players sorted by score descending', async () => {
      await service.createSession('room1', 'player1');
      await service.addPlayer('room1', 'player2');

      const session = await service.getSession('room1');
      session.players.get('player1').score = 20;
      session.players.get('player2').score = 30;
      mockStore.set(
        'quiz:session:room1',
        JSON.stringify({
          ...session,
          players: Object.fromEntries(session.players),
          answersReceived: Object.fromEntries(session.answersReceived),
        }),
      );

      const gameOver = await service.getGameOver('room1');
      expect(gameOver.players[0].id).toBe('player2');
      expect(gameOver.players[0].score).toBe(30);
      expect(gameOver.players[1].id).toBe('player1');
    });
  });
});
