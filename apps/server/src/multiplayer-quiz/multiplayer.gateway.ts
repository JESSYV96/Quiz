import { Room } from '@jessy/domain';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameStateService } from './game-state.service';

const QUESTION_TIMEOUT_MS = 30_000;
const RESULT_DISPLAY_MS = 3_000;

@WebSocketGateway(8082, {
  cors: {
    origin: '*',
  },
})
export class MultiplayerQuizGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameState: GameStateService) {}

  handleConnection(client: Socket) {
    console.log('New user', client.id);
    client.leave(client.id);
  }

  async handleDisconnect(client: Socket) {
    console.log('User disconnected', client.id);
    const roomName = await this.gameState.findRoomBySocketId(client.id);
    if (!roomName) return;

    const session = await this.gameState.getSession(roomName);
    if (!session) return;

    const { allAnswered, sessionDeleted } = await this.gameState.removePlayer(
      roomName,
      client.id,
    );

    if (sessionDeleted) {
      await this.broadcastRoomsList();
      return;
    }

    this.server.to(roomName).emit('user-disconnected', { userId: client.id });

    const updatedSession = await this.gameState.getSession(roomName);
    if (updatedSession) {
      this.server.to(roomName).emit('room-updated', {
        players: this.gameState.getPlayersArray(updatedSession),
        userAmount: updatedSession.players.size,
      });
    }

    await this.broadcastRoomsList();

    if (allAnswered) {
      await this.evaluateAndAdvance(roomName);
    }
  }

  @SubscribeMessage('create-new-room')
  async createRoom(
    @MessageBody() roomName: string,
    @ConnectedSocket() client: Socket,
  ): Promise<Room> {
    console.log('Room created', roomName);
    client.join(roomName);
    await this.gameState.createSession(roomName, client.id);
    await this.broadcastRoomsList();
    return {
      userAmount: 1,
      name: roomName,
      createdAt: new Date(),
      adminId: client.id,
      isAdmin: true,
      playerId: client.id,
    };
  }

  @SubscribeMessage('get-active-rooms')
  async getActiveRooms(): Promise<Room[]> {
    return this.gameState.getActiveLobbies();
  }

  @SubscribeMessage('join-room')
  async joinRoom(
    @MessageBody() roomName: string,
    @ConnectedSocket() client: Socket,
  ): Promise<Room> {
    client.join(roomName);
    await this.gameState.addPlayer(roomName, client.id);

    const session = await this.gameState.getSession(roomName);
    const players = session ? this.gameState.getPlayersArray(session) : [];
    const userAmount = session?.players.size ?? 0;

    this.server.to(roomName).emit('room-updated', { players, userAmount });
    this.server
      .to(roomName)
      .emit('user-connected', {
        userId: client.id,
        room: { name: roomName, userAmount },
      });
    await this.broadcastRoomsList();

    return {
      userAmount,
      name: roomName,
      adminId: session?.adminId,
      isAdmin: session?.adminId === client.id,
      playerId: client.id,
    };
  }

  @SubscribeMessage('leave-room')
  async leaveRoom(
    @MessageBody() roomName: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    client.leave(roomName);
    const { allAnswered, sessionDeleted } = await this.gameState.removePlayer(
      roomName,
      client.id,
    );

    if (sessionDeleted) {
      await this.broadcastRoomsList();
      return;
    }

    const session = await this.gameState.getSession(roomName);
    const players = session ? this.gameState.getPlayersArray(session) : [];
    const userAmount = session?.players.size ?? 0;

    this.server.to(roomName).emit('room-updated', { players, userAmount });
    await this.broadcastRoomsList();

    if (allAnswered) {
      await this.evaluateAndAdvance(roomName);
    }
  }

  @SubscribeMessage('start-game')
  async startGame(
    @MessageBody() roomName: string,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const session = await this.gameState.getSession(roomName);
    if (!session || session.adminId !== client.id) return;

    await this.gameState.startGame(roomName);

    const questionPayload = await this.gameState.getClientQuestion(roomName);

    this.server.to(roomName).emit('game-started');
    this.server.to(roomName).emit('new-question', questionPayload);

    this.startQuestionTimer(roomName);
  }

  @SubscribeMessage('submit-answer')
  async submitAnswer(
    @MessageBody() data: { roomName: string; answer: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const { roomName, answer } = data;
    const { allAnswered } = await this.gameState.submitAnswer(
      roomName,
      client.id,
      answer,
    );

    this.server
      .to(roomName)
      .emit('player-answered', { playerId: client.id });

    if (allAnswered) {
      this.gameState.clearTimer(roomName);
      await this.evaluateAndAdvance(roomName);
    }
  }

  private async evaluateAndAdvance(roomName: string): Promise<void> {
    const result = await this.gameState.evaluateQuestion(roomName);
    if (!result) return;

    this.server.to(roomName).emit('question-result', result);

    setTimeout(async () => {
      const nextQuestion = await this.gameState.advanceQuestion(roomName);

      if (nextQuestion) {
        this.server.to(roomName).emit('new-question', nextQuestion);
        this.startQuestionTimer(roomName);
      } else {
        const gameOver = await this.gameState.getGameOver(roomName);
        this.server.to(roomName).emit('game-over', gameOver);
        await this.gameState.deleteSession(roomName);
        await this.broadcastRoomsList();
      }
    }, RESULT_DISPLAY_MS);
  }

  private async broadcastRoomsList(): Promise<void> {
    const lobbies = await this.gameState.getActiveLobbies();
    this.server.emit('rooms-list-updated', lobbies);
  }

  private startQuestionTimer(roomName: string): void {
    this.gameState.clearTimer(roomName);

    const timer = setTimeout(async () => {
      this.gameState.clearTimer(roomName);
      await this.evaluateAndAdvance(roomName);
    }, QUESTION_TIMEOUT_MS);

    this.gameState.setTimer(roomName, timer);
  }
}
