export type Room = {
  name: string
  userAmount: number
  createdAt?: Date
  adminId?: string
  isAdmin?: boolean
  playerId?: string
}

export type Player = {
  id: string
  score: number
  hasAnswered: boolean
}

export type MultiplayerQuestion = {
  label: string
  type: 'multiple_choice' | 'boolean'
  difficulty: string
  theme: string
  answers: string[]
}

export type QuestionPayload = {
  question: MultiplayerQuestion
  questionIndex: number
  totalQuestions: number
}

export type QuestionResultPayload = {
  correctAnswer: string
  players: Player[]
  questionIndex: number
}

export type GameOverPayload = {
  players: Player[]
}

export type SubmitAnswerPayload = {
  roomName: string
  answer: string
}

export type StartGamePayload = {
  roomName: string
}
