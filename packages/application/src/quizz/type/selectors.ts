import { Answer, Difficulty, Effect, Language, Joker, Question } from '@jessy/domain'
import { QuizzState } from './slice'

const questionsSelector = (state: QuizzState): Question[] => {
  return state.game.questions
}

const totalQuestionSelector = (state: QuizzState): number => {
  return state.game.questions.length
}

const currentQuestionSelector = (state: QuizzState): Question => {
  return state.game.currentQuestion.question
}

const currentQuestionIndexSelector = (state: QuizzState): number => {
  return state.game.currentQuestion.index
}

const isEndOfQuizzSelector = (state: QuizzState): boolean => {
  return currentQuestionIndexSelector(state) >= totalQuestionSelector(state)
}

const scoreSelector = (state: QuizzState): number => {
  return state.game.score
}

const answersSelector = (state: QuizzState): Answer[] => {
  return state.game.currentAnswers
}

const selectedAnswerSelector = (state: QuizzState): Answer => {
  return state.game.selectedAnswer
}

const hasAnsweredSelector = (state: QuizzState): boolean => {
  return state.game.hasAnswered
}

const isRightAnswerSelector = (state: QuizzState): boolean => {
  return selectedAnswerSelector(state) === currentQuestionSelector(state).correctAnswer
}

const skipQuestionJokerSelector = (state: QuizzState): Joker => {
  return state.game.jokers.skipQuestion
}

const isQuizLoadingSelector = (state: QuizzState): boolean => {
  return state.game.isQuizLoading
}

// SETTINGS
const difficultySelector = (state: QuizzState): Difficulty => {
  return state.settings.difficulty
}

const effectSelector = (state: QuizzState): Effect => {
  return state.settings.effect
}

const languageSelector = (state: QuizzState): Language => {
  return state.settings.language
}

export default {
  questionsSelector,
  scoreSelector,
  answersSelector,
  currentQuestionSelector,
  currentQuestionIndexSelector,
  selectedAnswerSelector,
  totalQuestionSelector,
  isEndOfQuizzSelector,
  isRightAnswerSelector,
  hasAnsweredSelector,
  skipQuestionJokerSelector,
  isQuizLoadingSelector,
  difficultySelector,
  effectSelector,
  languageSelector
}
