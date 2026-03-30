import {
  Room,
  Player,
  QuestionPayload,
  QuestionResultPayload,
  GameOverPayload,
} from '../types'

export interface MultiplayerPort {
  connectionToMultiplayerSocket: () => void
  createQuizRoom: () => Promise<Room>
  getActiveRooms: () => Promise<Room[]>
  joinRoom: (roomName: string) => Promise<Room>
  leaveRoom: (roomName: string) => void
  startGame: (roomName: string) => void
  submitAnswer: (roomName: string, answer: string) => void

  onUserConnected(callback: (data: { userId: string; room: Room }) => void): void
  onUserDisconnected(callback: (data: { userId: string }) => void): void
  onGameStarted(callback: () => void): void
  onNewQuestion(callback: (data: QuestionPayload) => void): void
  onPlayerAnswered(callback: (data: { playerId: string }) => void): void
  onQuestionResult(callback: (data: QuestionResultPayload) => void): void
  onGameOver(callback: (data: GameOverPayload) => void): void
  onRoomUpdated(callback: (data: { players: Player[]; userAmount: number }) => void): void
  onRoomsListUpdated(callback: (data: Room[]) => void): void
  removeRoomsListListener(): void

  removeAllGameListeners(): void
}
