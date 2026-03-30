import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  Answer,
  Difficulty,
  Effect,
  Language,
  Errors,
  Joker,
  Question,
  Room,
  Player,
  MultiplayerQuestion,
  QuestionPayload,
  QuestionResultPayload,
  GameOverPayload,
} from '@jessy/domain'
import { getQuestions } from '../usecases/game/GetQuestions'
import selectors from './selectors'
import multiplayerSelectors from '../selectors/multiplayer'
import { selectDifficulty, selectEffect, selectLanguage } from '../usecases/settings'
import {
  selectQuestionMode,
  initQuizz,
  goToNextQuestion,
  removeIncorrectAnswers,
  selectAnswer,
  selectQuestion,
  shuffleAnswers,
  skipQuestion,
  validateAnswer
} from '../usecases/game'
import { QuizDependencies } from '../../store'
import { createRoom } from '../usecases/multiplayer/CreateRoom'
import { getActiveRooms } from '../usecases/multiplayer/GetActiveRooms'
import { joinRoom } from '../usecases/multiplayer/JoinRoom'
import { multiplayerSubmitAnswer } from '../usecases/multiplayer/SubmitAnswer'

export interface ThunkApi {
  extra: {
    services: QuizDependencies
  }
}

export type MultiplayerGameState = {
  status: 'idle' | 'playing' | 'showing-result' | 'finished'
  currentQuestion: MultiplayerQuestion | null
  questionIndex: number
  totalQuestions: number
  selectedAnswer: string | null
  hasSubmitted: boolean
  players: Player[]
  questionResult: {
    correctAnswer: string
    players: Player[]
  } | null
  answeredPlayerIds: string[]
}

export type QuizzState = {
  game: {
    score: number
    questions: Question[]
    isQuizLoading: boolean
    currentQuestion: {
      index: number
      question: Question | null
    }
    currentAnswers: string[]
    selectedAnswer: Answer | null
    hasAnswered: boolean
    jokers: {
      skipQuestion: Joker
      fiftyFifty: Joker
    }
  }
  multiplayer: {
    room: Room | null
    activeRooms: Room[]
    game: MultiplayerGameState
  }
  settings: {
    difficulty: Difficulty
    effect: Effect
    language: Language
  }
}

const initialMultiplayerGame: MultiplayerGameState = {
  status: 'idle',
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 0,
  selectedAnswer: null,
  hasSubmitted: false,
  players: [],
  questionResult: null,
  answeredPlayerIds: [],
}

export const initialState: QuizzState = {
  game: {
    questions: [],
    isQuizLoading: false,
    currentQuestion: {
      index: 0,
      question: null
    },
    currentAnswers: [],
    selectedAnswer: null,
    hasAnswered: false,
    score: 0,
    jokers: {
      skipQuestion: {
        remaining: 1,
        error: null
      },
      fiftyFifty: {
        remaining: 1,
        error: null
      }
    }
  },
  multiplayer: {
    room: null,
    activeRooms: [],
    game: { ...initialMultiplayerGame },
  },
  settings: {
    difficulty: Difficulty.None,
    effect: Effect.None,
    language: Language.French
  }
}

export const quizzSlice = createSlice({
  name: 'quizz',
  initialState,
  selectors: {
    ...selectors,
    ...multiplayerSelectors
  },
  reducers: {
    selectAnswer,
    selectQuestion,
    shuffleAnswers,
    validateAnswer,
    selectDifficulty,
    selectEffect,
    selectLanguage,
    initQuizz(state: QuizzState) {
      state.game = { ...initialState.game }
    },
    selectQuestionMode(state: QuizzState, action: PayloadAction<boolean>) {
      state.game.hasAnswered = action.payload
      return state
    },
    removeIncorrectAnswers(
      state: QuizzState,
      action: PayloadAction<{ question: Question; randomNumber: number }>
    ) {
      if (state.game.jokers.fiftyFifty.remaining === 0) {
        state.game.jokers.fiftyFifty.error = Errors.JOKER_FIFTY_FIFTY_ALREADY_USED
        return
      }

      if (action.payload.question.type !== 'multiple_choice') {
        state.game.jokers.fiftyFifty.error = Errors.JOKER_FIFTY_FIFTY_WRONG_TYPE
        return
      }
      const incorrectAnswers = action.payload.question.incorrectAnswers || []

      const incorrectAnswersRemoved = [...incorrectAnswers].splice(
        Math.floor(action.payload.randomNumber * incorrectAnswers.length),
        1
      )

      state.game.currentAnswers =
        [action.payload.question.correctAnswer, ...incorrectAnswersRemoved].sort(
          () => action.payload.randomNumber - 0.5
        ) || []
      state.game.jokers.fiftyFifty.remaining -= 1
    },
    skipQuestion(state: QuizzState) {
      if (state.game.jokers.skipQuestion.remaining < 1) {
        state.game.jokers.skipQuestion.error = Errors.JOKER_SKIP_QUESTION_ALREADY_USED
      } else {
        state.game.jokers.skipQuestion.remaining -= 1
        goToNextQuestion(state)
      }
    },
    goToNextQuestion(state: QuizzState) {
      if (state.game.currentQuestion.index < state.game.questions.length) {
        state.game.currentQuestion.index += 1
      }
    },

    // Multiplayer reducers
    multiplayerGameStarted(state: QuizzState) {
      state.multiplayer.game.status = 'playing'
    },
    multiplayerNewQuestion(state: QuizzState, action: PayloadAction<QuestionPayload>) {
      state.multiplayer.game.currentQuestion = action.payload.question
      state.multiplayer.game.questionIndex = action.payload.questionIndex
      state.multiplayer.game.totalQuestions = action.payload.totalQuestions
      state.multiplayer.game.selectedAnswer = null
      state.multiplayer.game.hasSubmitted = false
      state.multiplayer.game.answeredPlayerIds = []
      state.multiplayer.game.questionResult = null
      state.multiplayer.game.status = 'playing'
    },
    multiplayerSelectAnswer(state: QuizzState, action: PayloadAction<string>) {
      state.multiplayer.game.selectedAnswer = action.payload
    },
    multiplayerPlayerAnswered(state: QuizzState, action: PayloadAction<{ playerId: string }>) {
      if (!state.multiplayer.game.answeredPlayerIds.includes(action.payload.playerId)) {
        state.multiplayer.game.answeredPlayerIds.push(action.payload.playerId)
      }
    },
    multiplayerQuestionResult(state: QuizzState, action: PayloadAction<QuestionResultPayload>) {
      state.multiplayer.game.questionResult = {
        correctAnswer: action.payload.correctAnswer,
        players: action.payload.players,
      }
      state.multiplayer.game.players = action.payload.players
      state.multiplayer.game.status = 'showing-result'
    },
    multiplayerGameOver(state: QuizzState, action: PayloadAction<GameOverPayload>) {
      state.multiplayer.game.players = action.payload.players
      state.multiplayer.game.status = 'finished'
    },
    multiplayerRoomUpdated(
      state: QuizzState,
      action: PayloadAction<{ players: Player[]; userAmount: number }>
    ) {
      state.multiplayer.game.players = action.payload.players
      if (state.multiplayer.room) {
        state.multiplayer.room.userAmount = action.payload.userAmount
      }
    },
    multiplayerPlayerDisconnected(
      state: QuizzState,
      action: PayloadAction<{ userId: string }>
    ) {
      state.multiplayer.game.players = state.multiplayer.game.players.filter(
        (p) => p.id !== action.payload.userId
      )
    },
    multiplayerReset(state: QuizzState) {
      state.multiplayer.game = { ...initialMultiplayerGame }
      state.multiplayer.room = null
    },
    multiplayerRoomsListUpdated(state: QuizzState, action: PayloadAction<Room[]>) {
      state.multiplayer.activeRooms = action.payload
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getQuestions.fulfilled, (state, action) => {
      state.game.questions = action.payload
      state.game.isQuizLoading = false
      return state
    })
    builder.addCase(getQuestions.pending, (state, action) => {
      state.game.isQuizLoading = true
      return state
    })
    builder.addCase(createRoom.fulfilled, (state, action) => {
      state.multiplayer.room = { ...action.payload }
    })
    builder.addCase(getActiveRooms.fulfilled, (state, action) => {
      state.multiplayer.activeRooms = [...action.payload]
    })
    builder.addCase(joinRoom.fulfilled, (state, action) => {
      state.multiplayer.room = action.payload
    })
    builder.addCase(multiplayerSubmitAnswer.fulfilled, (state) => {
      state.multiplayer.game.hasSubmitted = true
    })
  }
})

export const appSelectors = quizzSlice.selectors
export const appActions = quizzSlice.actions
