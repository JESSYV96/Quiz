import { Injectable } from '@nestjs/common';
import {
  Player,
  MultiplayerQuestion,
  QuestionPayload,
  QuestionResultPayload,
  GameOverPayload,
  Question,
} from '@jessy/domain';
import Redis from 'ioredis';

// Ce qu'on stocke dans Redis (pas de Map, pas de Timer — tout doit etre serialisable en JSON)
export type RedisGameSession = {
  roomName: string;
  adminId: string;
  status: 'lobby' | 'in-progress' | 'finished';
  players: Record<string, Player>;
  questions: Question[];
  currentQuestionIndex: number;
  answersReceived: Record<string, string>;
};

// Ce qu'on utilise dans le code (avec Map pour la commodite)
export type GameSession = {
  roomName: string;
  adminId: string;
  status: 'lobby' | 'in-progress' | 'finished';
  players: Map<string, Player>;
  questions: Question[];
  currentQuestionIndex: number;
  answersReceived: Map<string, string>;
};

const SESSION_TTL = 3600; // 1 heure en secondes
const SESSION_PREFIX = 'quiz:session:';
const PLAYER_PREFIX = 'quiz:player:';

@Injectable()
export class GameStateService {
  private redis: Redis;

  // Les timers restent en memoire locale : ils ne sont pas serialisables
  // et sont recrees par le gateway si le serveur redemarre
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  // --- Serialisation : conversion entre le format Redis (objets) et le format code (Maps) ---

  private toRedis(session: GameSession): string {
    const redisSession: RedisGameSession = {
      roomName: session.roomName,
      adminId: session.adminId,
      status: session.status,
      players: Object.fromEntries(session.players),
      questions: session.questions,
      currentQuestionIndex: session.currentQuestionIndex,
      answersReceived: Object.fromEntries(session.answersReceived),
    };
    return JSON.stringify(redisSession);
  }

  private fromRedis(json: string): GameSession {
    const data: RedisGameSession = JSON.parse(json);
    return {
      roomName: data.roomName,
      adminId: data.adminId,
      status: data.status,
      players: new Map(Object.entries(data.players)),
      questions: data.questions,
      currentQuestionIndex: data.currentQuestionIndex,
      answersReceived: new Map(Object.entries(data.answersReceived)),
    };
  }

  private async saveSession(session: GameSession): Promise<void> {
    await this.redis.set(
      SESSION_PREFIX + session.roomName,
      this.toRedis(session),
      'EX',
      SESSION_TTL,
    );
  }

  // --- CRUD Sessions ---

  async createSession(roomName: string, adminId: string): Promise<void> {
    const session: GameSession = {
      roomName,
      adminId,
      status: 'lobby',
      players: new Map([
        [adminId, { id: adminId, score: 0, hasAnswered: false }],
      ]),
      questions: [],
      currentQuestionIndex: 0,
      answersReceived: new Map(),
    };
    await this.saveSession(session);
    await this.redis.set(
      PLAYER_PREFIX + adminId,
      roomName,
      'EX',
      SESSION_TTL,
    );
  }

  async getSession(roomName: string): Promise<GameSession | undefined> {
    const json = await this.redis.get(SESSION_PREFIX + roomName);
    if (!json) return undefined;
    return this.fromRedis(json);
  }

  async addPlayer(roomName: string, socketId: string): Promise<void> {
    const session = await this.getSession(roomName);
    if (!session) return;
    session.players.set(socketId, {
      id: socketId,
      score: 0,
      hasAnswered: false,
    });
    await this.saveSession(session);
    await this.redis.set(
      PLAYER_PREFIX + socketId,
      roomName,
      'EX',
      SESSION_TTL,
    );
  }

  async removePlayer(
    roomName: string,
    socketId: string,
  ): Promise<{ allAnswered: boolean; sessionDeleted: boolean }> {
    const session = await this.getSession(roomName);
    if (!session) return { allAnswered: false, sessionDeleted: false };

    session.players.delete(socketId);
    session.answersReceived.delete(socketId);
    await this.redis.del(PLAYER_PREFIX + socketId);

    if (session.players.size === 0) {
      await this.deleteSession(roomName);
      return { allAnswered: false, sessionDeleted: true };
    }

    const allAnswered =
      session.status === 'in-progress' && this.haveAllPlayersAnswered(session);

    await this.saveSession(session);
    return { allAnswered, sessionDeleted: false };
  }

  async deleteSession(roomName: string): Promise<void> {
    const timer = this.timers.get(roomName);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(roomName);
    }

    // Supprimer les index joueurs avant la session
    const session = await this.getSession(roomName);
    if (session) {
      const playerKeys = [...session.players.keys()].map(
        (id) => PLAYER_PREFIX + id,
      );
      if (playerKeys.length > 0) {
        await this.redis.del(...playerKeys);
      }
    }

    await this.redis.del(SESSION_PREFIX + roomName);
  }

  // --- Logique de jeu ---

  async startGame(roomName: string): Promise<void> {
    const session = await this.getSession(roomName);
    if (!session) throw new Error(`Session ${roomName} not found`);

    const questions = await this.fetchQuestions();
    session.questions = questions;
    session.currentQuestionIndex = 0;
    session.status = 'in-progress';
    session.answersReceived.clear();

    for (const player of session.players.values()) {
      player.score = 0;
      player.hasAnswered = false;
    }

    await this.saveSession(session);
  }

  async submitAnswer(
    roomName: string,
    socketId: string,
    answer: string,
  ): Promise<{ allAnswered: boolean }> {
    const session = await this.getSession(roomName);
    if (!session || session.status !== 'in-progress')
      return { allAnswered: false };

    if (session.answersReceived.has(socketId)) return { allAnswered: false };

    session.answersReceived.set(socketId, answer);

    const player = session.players.get(socketId);
    if (player) player.hasAnswered = true;

    await this.saveSession(session);
    return { allAnswered: this.haveAllPlayersAnswered(session) };
  }

  async evaluateQuestion(
    roomName: string,
  ): Promise<QuestionResultPayload | null> {
    const session = await this.getSession(roomName);
    if (!session) return null;

    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) return null;

    for (const [socketId, player] of session.players) {
      const answer = session.answersReceived.get(socketId);
      if (answer === currentQuestion.correctAnswer) {
        player.score += 10;
      } else if (answer !== undefined && player.score >= 5) {
        player.score -= 5;
      }
    }

    await this.saveSession(session);

    return {
      correctAnswer: currentQuestion.correctAnswer,
      players: this.getPlayersArray(session),
      questionIndex: session.currentQuestionIndex,
    };
  }

  async advanceQuestion(roomName: string): Promise<QuestionPayload | null> {
    const session = await this.getSession(roomName);
    if (!session) return null;

    session.currentQuestionIndex++;
    session.answersReceived.clear();

    for (const player of session.players.values()) {
      player.hasAnswered = false;
    }

    if (session.currentQuestionIndex >= session.questions.length) {
      session.status = 'finished';
      await this.saveSession(session);
      return null;
    }

    await this.saveSession(session);
    return this.buildQuestionPayload(session);
  }

  async getClientQuestion(roomName: string): Promise<QuestionPayload | null> {
    const session = await this.getSession(roomName);
    if (!session) return null;
    return this.buildQuestionPayload(session);
  }

  async getGameOver(roomName: string): Promise<GameOverPayload | null> {
    const session = await this.getSession(roomName);
    if (!session) return null;

    const players = this.getPlayersArray(session).sort(
      (a, b) => b.score - a.score,
    );
    return { players };
  }

  // --- Recherches ---

  getPlayersArray(session: GameSession): Player[] {
    return [...session.players.values()];
  }

  async findRoomBySocketId(socketId: string): Promise<string | undefined> {
    const roomName = await this.redis.get(PLAYER_PREFIX + socketId);
    return roomName || undefined;
  }

  async getActiveLobbies(): Promise<{ name: string; userAmount: number }[]> {
    const keys = await this.redis.keys(SESSION_PREFIX + '*');
    const lobbies: { name: string; userAmount: number }[] = [];

    for (const key of keys) {
      const json = await this.redis.get(key);
      if (!json) continue;
      const session = this.fromRedis(json);
      if (session.status === 'lobby') {
        lobbies.push({
          name: session.roomName,
          userAmount: session.players.size,
        });
      }
    }

    return lobbies;
  }

  // --- Timers (restent en memoire locale) ---

  setTimer(roomName: string, timer: ReturnType<typeof setTimeout>): void {
    this.timers.set(roomName, timer);
  }

  clearTimer(roomName: string): void {
    const timer = this.timers.get(roomName);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(roomName);
    }
  }

  getTimer(roomName: string): ReturnType<typeof setTimeout> | undefined {
    return this.timers.get(roomName);
  }

  // --- Utilitaires prives ---

  private haveAllPlayersAnswered(session: GameSession): boolean {
    return session.answersReceived.size >= session.players.size;
  }

  private buildQuestionPayload(session: GameSession): QuestionPayload {
    const question = session.questions[session.currentQuestionIndex];
    const answers = this.shuffleArray([
      question.correctAnswer,
      ...question.incorrectAnswers,
    ]);

    const clientQuestion: MultiplayerQuestion = {
      label: question.label,
      type: question.type,
      difficulty: question.difficulty,
      theme: question.theme,
      answers,
    };

    return {
      question: clientQuestion,
      questionIndex: session.currentQuestionIndex,
      totalQuestions: session.questions.length,
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async fetchQuestions(): Promise<Question[]> {
    const response = await fetch(
      'https://opentdb.com/api.php?amount=5&category=31&type=multiple',
    );
    const data = await response.json();

    return data.results.map(
      (q: {
        question: string;
        type: string;
        difficulty: string;
        category: string;
        incorrect_answers: string[];
        correct_answer: string;
      }) => ({
        label: q.question,
        type: q.type === 'multiple' ? 'multiple_choice' : 'boolean',
        difficulty: q.difficulty,
        theme: q.category,
        incorrectAnswers: q.incorrect_answers,
        correctAnswer: q.correct_answer,
      }),
    );
  }
}
