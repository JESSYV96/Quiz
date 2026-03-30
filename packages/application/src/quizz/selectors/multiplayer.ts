import { MULTIPLAYER_QUIZ_REQUIRED_NUMBER, Room, Player, MultiplayerQuestion } from '@jessy/domain'
import { QuizzState, MultiplayerGameState } from '../type'

const roomSelector = (state: QuizzState): Room | null => {
  return state.multiplayer.room
}

const hasRequiredPlayerSelector = (state: QuizzState): boolean => {
  return (state.multiplayer.room?.userAmount ?? 0) >= MULTIPLAYER_QUIZ_REQUIRED_NUMBER
}

const activeRoomsSelector = (state: QuizzState): Room[] => {
  return state.multiplayer.activeRooms
}

const multiplayerGameStatusSelector = (state: QuizzState): MultiplayerGameState['status'] => {
  return state.multiplayer.game.status
}

const multiplayerCurrentQuestionSelector = (state: QuizzState): MultiplayerQuestion | null => {
  return state.multiplayer.game.currentQuestion
}

const multiplayerQuestionIndexSelector = (state: QuizzState): number => {
  return state.multiplayer.game.questionIndex
}

const multiplayerTotalQuestionsSelector = (state: QuizzState): number => {
  return state.multiplayer.game.totalQuestions
}

const multiplayerSelectedAnswerSelector = (state: QuizzState): string | null => {
  return state.multiplayer.game.selectedAnswer
}

const multiplayerHasSubmittedSelector = (state: QuizzState): boolean => {
  return state.multiplayer.game.hasSubmitted
}

const multiplayerPlayersSelector = (state: QuizzState): Player[] => {
  return state.multiplayer.game.players
}

const multiplayerQuestionResultSelector = (state: QuizzState) => {
  return state.multiplayer.game.questionResult
}

const multiplayerAnsweredCountSelector = (state: QuizzState): number => {
  return state.multiplayer.game.answeredPlayerIds.length
}

const isAdminSelector = (state: QuizzState): boolean => {
  return state.multiplayer.room?.isAdmin ?? false
}

export default {
  roomSelector,
  hasRequiredPlayerSelector,
  activeRoomsSelector,
  multiplayerGameStatusSelector,
  multiplayerCurrentQuestionSelector,
  multiplayerQuestionIndexSelector,
  multiplayerTotalQuestionsSelector,
  multiplayerSelectedAnswerSelector,
  multiplayerHasSubmittedSelector,
  multiplayerPlayersSelector,
  multiplayerQuestionResultSelector,
  multiplayerAnsweredCountSelector,
  isAdminSelector,
}
