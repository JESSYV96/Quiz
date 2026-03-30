import React, { useEffect } from 'react'
import { View, StyleSheet, FlatList, Text, Pressable } from 'react-native'
import { useSelector } from 'react-redux'
import { appSelectors, appActions, multiplayerSubmitAnswer, leaveRoom } from '@jessy/application'
import DefautLayout from 'src/layouts/DefautLayout'
import AppText from 'src/components/themes/Text'
import Themes from 'src/constants/Themes'
import { useAppDispatch } from 'src/configs/store'
import CircularButton from 'src/components/themes/buttons/CircularButton'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from '../../i18n'

const MultiplayerGameScreen = ({ navigation }: any) => {
  const {
    multiplayerCurrentQuestionSelector,
    multiplayerQuestionIndexSelector,
    multiplayerTotalQuestionsSelector,
    multiplayerSelectedAnswerSelector,
    multiplayerHasSubmittedSelector,
    multiplayerPlayersSelector,
    multiplayerQuestionResultSelector,
    multiplayerAnsweredCountSelector,
    multiplayerGameStatusSelector,
    roomSelector,
  } = appSelectors

  const currentQuestion = useSelector(multiplayerCurrentQuestionSelector)
  const questionIndex = useSelector(multiplayerQuestionIndexSelector)
  const totalQuestions = useSelector(multiplayerTotalQuestionsSelector)
  const selectedAnswer = useSelector(multiplayerSelectedAnswerSelector)
  const hasSubmitted = useSelector(multiplayerHasSubmittedSelector)
  const players = useSelector(multiplayerPlayersSelector)
  const questionResult = useSelector(multiplayerQuestionResultSelector)
  const answeredCount = useSelector(multiplayerAnsweredCountSelector)
  const gameStatus = useSelector(multiplayerGameStatusSelector)
  const room = useSelector(roomSelector)

  const dispatch = useAppDispatch()
  const t = useTranslation()

  useEffect(() => {
    if (gameStatus === 'finished') {
      navigation.navigate('MultiplayerScoreboard')
    }
  }, [gameStatus])

  const handleSelectAnswer = (answer: string) => {
    if (!hasSubmitted && gameStatus === 'playing') {
      dispatch(appActions.multiplayerSelectAnswer(answer))
    }
  }

  const handleSubmitAnswer = () => {
    if (room && selectedAnswer) {
      dispatch(multiplayerSubmitAnswer({ roomName: room.name, answer: selectedAnswer }))
    }
  }

  const handleLeave = () => {
    if (room) {
      dispatch(leaveRoom({ roomName: room.name }))
      dispatch(appActions.multiplayerReset())
      navigation.navigate('MultiplayerHome')
    }
  }

  const getAnswerStyle = (answer: string) => {
    const isSelected = selectedAnswer === answer
    const isShowingResult = gameStatus === 'showing-result' && questionResult

    if (isShowingResult) {
      if (answer === questionResult.correctAnswer) {
        return styles.answerCorrect
      }
      if (isSelected && answer !== questionResult.correctAnswer) {
        return styles.answerWrong
      }
    }

    if (isSelected) {
      return styles.answerSelected
    }

    return {}
  }

  const getAnswerTextColor = (answer: string) => {
    const isSelected = selectedAnswer === answer
    const isShowingResult = gameStatus === 'showing-result' && questionResult

    if (isShowingResult) {
      if (answer === questionResult.correctAnswer) return '#fff'
      if (isSelected) return '#fff'
    }
    if (isSelected) return '#fff'
    return Themes.colors.text
  }

  if (!currentQuestion) {
    return (
      <DefautLayout>
        <View style={styles.loadingContainer}>
          <AppText>{t.game.loading}</AppText>
        </View>
      </DefautLayout>
    )
  }

  const progress = totalQuestions > 0 ? ((questionIndex + 1) / totalQuestions) * 100 : 0

  return (
    <DefautLayout>
      <View style={styles.header}>
        <CircularButton onPress={handleLeave}>
          <Ionicons name="close" size={24} color="white" />
        </CircularButton>
        <AppText size={14} color={Themes.colors.text}>
          {t.game.question(questionIndex + 1, totalQuestions)}
        </AppText>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Score bar */}
      <View style={styles.scoresBar}>
        {players.map((player, index) => (
          <View key={player.id} style={styles.scoreChip}>
            <View style={styles.scoreAvatar}>
              <AppText size={9} color="#fff">
                {player.id === room?.playerId ? 'Moi' : `J${index + 1}`}
              </AppText>
            </View>
            <AppText size={13} color={Themes.colors.text}>
              {player.score}
            </AppText>
          </View>
        ))}
      </View>

      {/* Question */}
      <View style={styles.questionCard}>
        <AppText size={15} color={Themes.colors.text}>
          {currentQuestion.label}
        </AppText>
      </View>

      {/* Answers */}
      <FlatList
        data={currentQuestion.answers}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.answersList}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => handleSelectAnswer(item)}
            disabled={hasSubmitted}
            style={({ pressed }) => [
              styles.answerItem,
              getAnswerStyle(item),
              pressed && !hasSubmitted && styles.answerPressed,
            ]}
          >
            <View style={[styles.answerLetter, getAnswerStyle(item)]}>
              <Text
                style={[
                  styles.answerLetterText,
                  { color: getAnswerTextColor(item) },
                ]}
              >
                {String.fromCharCode(65 + index)}
              </Text>
            </View>
            <Text
              style={[styles.answerText, { color: getAnswerTextColor(item) }]}
            >
              {item}
            </Text>
          </Pressable>
        )}
      />

      {/* Actions */}
      <View style={styles.footer}>
        {gameStatus === 'playing' && !hasSubmitted && (
          <Pressable
            onPress={handleSubmitAnswer}
            disabled={!selectedAnswer}
            style={({ pressed }) => [
              styles.validateButton,
              !selectedAnswer && styles.validateButtonDisabled,
              pressed && selectedAnswer && styles.buttonPressed,
            ]}
          >
            <AppText color="white" size={16}>
              {t.game.validate}
            </AppText>
          </Pressable>
        )}

        {gameStatus === 'playing' && hasSubmitted && (
          <View style={styles.waitingBanner}>
            <AppText size={13} color={Themes.colors.gray}>
              {t.multiplayer.waitingOthers(answeredCount, players.length)}
            </AppText>
          </View>
        )}

        {gameStatus === 'showing-result' && questionResult && (
          <View style={styles.resultBanner}>
            <Ionicons name="checkmark-circle" size={20} color={Themes.colors.primary} />
            <AppText size={13} color={Themes.colors.primary}>
              {t.multiplayer.correctAnswer}: {questionResult.correctAnswer}
            </AppText>
          </View>
        )}
      </View>
    </DefautLayout>
  )
}

export default MultiplayerGameScreen

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Themes.colors.primary,
    borderRadius: 2,
  },
  scoresBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Themes.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  answersList: {
    gap: 10,
    marginTop: 20,
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#fff',
    gap: 12,
  },
  answerSelected: {
    borderColor: Themes.colors.primary,
    backgroundColor: Themes.colors.primary,
  },
  answerCorrect: {
    borderColor: Themes.colors.primary,
    backgroundColor: Themes.colors.primary,
  },
  answerWrong: {
    borderColor: Themes.colors.danger,
    backgroundColor: Themes.colors.danger,
  },
  answerPressed: {
    opacity: 0.85,
  },
  answerLetter: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Themes.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerLetterText: {
    fontWeight: '700',
    fontSize: 13,
  },
  answerText: {
    fontSize: 13,
    flex: 1,
  },
  footer: {
    paddingVertical: 16,
  },
  validateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: Themes.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  validateButtonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  waitingBanner: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: Themes.colors.primary + '10',
    borderRadius: 12,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Themes.colors.primary + '10',
    borderRadius: 12,
  },
})
