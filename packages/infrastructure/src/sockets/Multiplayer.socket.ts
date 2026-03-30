import {
  MultiplayerPort,
  MultiplayerEvent,
  MultiplayerListeners,
  Room,
  Player,
  QuestionPayload,
  QuestionResultPayload,
  GameOverPayload,
} from '@jessy/domain'
import { io } from 'socket.io-client'

export class MultiplayerSocket implements MultiplayerPort {
  socket = io('ws://localhost:8082')

  connectionToMultiplayerSocket() {
    this.socket.connect()
  }

  async createQuizRoom(): Promise<Room> {
    return this.socket.emitWithAck(MultiplayerEvent.CreateNewRoom, 'ROOM_TEST')
  }

  async getActiveRooms(): Promise<Room[]> {
    return this.socket.emitWithAck(MultiplayerEvent.GetActiveRooms)
  }

  async joinRoom(roomName: string): Promise<Room> {
    return this.socket.emitWithAck(MultiplayerEvent.JoinRoom, roomName)
  }

  leaveRoom(roomName: string): void {
    this.socket.emit(MultiplayerEvent.LeaveRoom, roomName)
  }

  startGame(roomName: string): void {
    this.socket.emit(MultiplayerEvent.StartGame, roomName)
  }

  submitAnswer(roomName: string, answer: string): void {
    this.socket.emit(MultiplayerEvent.SubmitAnswer, { roomName, answer })
  }

  onUserConnected(callback: (data: { userId: string; room: Room }) => void): void {
    this.socket.on(MultiplayerListeners.UserConnected, callback)
  }

  onUserDisconnected(callback: (data: { userId: string }) => void): void {
    this.socket.on(MultiplayerListeners.UserDisconnected, callback)
  }

  onGameStarted(callback: () => void): void {
    this.socket.on(MultiplayerListeners.GameStarted, callback)
  }

  onNewQuestion(callback: (data: QuestionPayload) => void): void {
    this.socket.on(MultiplayerListeners.NewQuestion, callback)
  }

  onPlayerAnswered(callback: (data: { playerId: string }) => void): void {
    this.socket.on(MultiplayerListeners.PlayerAnswered, callback)
  }

  onQuestionResult(callback: (data: QuestionResultPayload) => void): void {
    this.socket.on(MultiplayerListeners.QuestionResult, callback)
  }

  onGameOver(callback: (data: GameOverPayload) => void): void {
    this.socket.on(MultiplayerListeners.GameOver, callback)
  }

  onRoomUpdated(callback: (data: { players: Player[]; userAmount: number }) => void): void {
    this.socket.on(MultiplayerListeners.RoomUpdated, callback)
  }

  onRoomsListUpdated(callback: (data: Room[]) => void): void {
    this.socket.on(MultiplayerListeners.RoomsListUpdated, callback)
  }

  removeRoomsListListener(): void {
    this.socket.off(MultiplayerListeners.RoomsListUpdated)
  }

  removeAllGameListeners(): void {
    Object.values(MultiplayerListeners).forEach((event) => {
      this.socket.off(event)
    })
  }
}
