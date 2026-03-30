import { View, StyleSheet, FlatList, Pressable } from 'react-native'
import React from 'react'
import JokerItem from './JokerItem'
import AppText from '../themes/Text'
import AnswerItem from './AnswerItem'
import Themes from '../../constants/Themes'
import { useSelector } from 'react-redux'
import { appActions, appSelectors } from '@jessy/application'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useAppDispatch } from '../../configs/store'
import { Answer } from '@jessy/domain'
import { useTranslation } from '../../i18n'

const QuestionCard = () => {
  const { currentQuestionSelector, answersSelector, selectedAnswerSelector, hasAnsweredSelector } =
    appSelectors

  const { validateAnswer, goToNextQuestion, skipQuestion, removeIncorrectAnswers } = appActions

  const answers = useSelector(answersSelector)
  const currentQuestion = useSelector(currentQuestionSelector)
  const selectedAnswer = useSelector(selectedAnswerSelector)
  const hasAnsweredQuestion = useSelector(hasAnsweredSelector)

  const dispatch = useAppDispatch()
  const t = useTranslation()

  const shouldCheckAnswer = (answer: Answer) => {
    return selectedAnswer === answer
  }

  return (
    <View style={styles.questionCard}>
      <View style={styles.questionContainer}>
        {currentQuestion && (
          <AppText color={Themes.colors.text} size={15}>
            {currentQuestion.label}
          </AppText>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <FlatList
          data={answers}
          contentContainerStyle={styles.answersList}
          renderItem={({ item, index }) => (
            <AnswerItem
              text={item}
              letter={String.fromCharCode(65 + index)}
              shouldCheckAnswer={shouldCheckAnswer(item)}
            />
          )}
        />
        {!hasAnsweredQuestion ? (
          <Pressable
            disabled={!Boolean(selectedAnswer)}
            onPress={() => dispatch(validateAnswer(selectedAnswer))}
            style={({ pressed }) => [
              styles.actionButton,
              styles.validateButton,
              !selectedAnswer && styles.actionButtonDisabled,
              pressed && selectedAnswer && styles.buttonPressed,
            ]}
          >
            <AppText color="white" size={15}>
              {t.game.validate}
            </AppText>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => dispatch(goToNextQuestion())}
            style={({ pressed }) => [
              styles.actionButton,
              styles.nextButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={styles.nextContent}>
              <AppText color="white" size={15}>
                {t.game.next}
              </AppText>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </View>
          </Pressable>
        )}
      </View>
      <View style={styles.jokersContainer}>
        <JokerItem
          label="50/50"
          icon={<MaterialIcons name="question-answer" size={22} color="#fff" />}
          onPress={() =>
            dispatch(
              removeIncorrectAnswers({ question: currentQuestion, randomNumber: Math.random() })
            )
          }
        />
        <JokerItem
          label={t.game.skip}
          icon={<MaterialIcons name="keyboard-double-arrow-right" size={24} color="#fff" />}
          onPress={() => {
            dispatch(skipQuestion())
          }}
        />
      </View>
    </View>
  )
}

export default QuestionCard

const styles = StyleSheet.create({
  questionCard: {
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginVertical: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  questionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: Themes.colors.background,
  },
  answersList: {
    gap: 8,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
  },
  validateButton: {
    backgroundColor: Themes.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButton: {
    backgroundColor: Themes.colors.secondary,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  nextContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jokersContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
})
