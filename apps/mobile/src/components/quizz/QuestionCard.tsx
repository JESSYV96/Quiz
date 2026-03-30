import { View, StyleSheet, FlatList, Pressable, Animated } from 'react-native'
import React, { useRef, useEffect } from 'react'
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

  const questionFade = useRef(new Animated.Value(0)).current
  const questionSlide = useRef(new Animated.Value(20)).current

  useEffect(() => {
    questionFade.setValue(0)
    questionSlide.setValue(20)
    Animated.parallel([
      Animated.timing(questionFade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(questionSlide, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start()
  }, [currentQuestion?.label])

  const shouldCheckAnswer = (answer: Answer) => {
    return selectedAnswer === answer
  }

  return (
    <View style={styles.root}>
      {/* Question */}
      <Animated.View
        style={[
          styles.questionBubble,
          {
            opacity: questionFade,
            transform: [{ translateY: questionSlide }],
          },
        ]}
      >
        {currentQuestion && (
          <AppText color={Themes.colors.text} size={16}>
            {currentQuestion.label}
          </AppText>
        )}
      </Animated.View>

      {/* Answers */}
      <View style={styles.answersSection}>
        <FlatList
          data={answers}
          contentContainerStyle={styles.answersList}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item, index }) => (
            <AnswerItem
              text={item}
              letter={String.fromCharCode(65 + index)}
              shouldCheckAnswer={shouldCheckAnswer(item)}
              index={index}
            />
          )}
        />
      </View>

      {/* Action button */}
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
            <AppText color={Themes.colors.text} size={15}>
              {t.game.next}
            </AppText>
            <Ionicons name="arrow-forward" size={18} color={Themes.colors.text} />
          </View>
        </Pressable>
      )}

      {/* Jokers */}
      <View style={styles.jokersContainer}>
        <JokerItem
          label="50/50"
          icon={<MaterialIcons name="auto-fix-high" size={18} color={Themes.colors.primary} />}
          onPress={() =>
            dispatch(
              removeIncorrectAnswers({ question: currentQuestion, randomNumber: Math.random() })
            )
          }
        />
        <JokerItem
          label={t.game.skip}
          icon={<Ionicons name="play-skip-forward" size={18} color={Themes.colors.secondary} />}
          onPress={() => {
            dispatch(skipQuestion())
          }}
          variant="secondary"
        />
      </View>
    </View>
  )
}

export default QuestionCard

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
  },
  questionBubble: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
  },
  answersSection: {
    flex: 1,
    marginTop: 20,
    marginBottom: 8,
  },
  answersList: {
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  validateButton: {
    backgroundColor: Themes.colors.primary,
    shadowColor: Themes.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButton: {
    backgroundColor: Themes.colors.secondary + '35',
    borderWidth: 1.5,
    borderColor: Themes.colors.secondary + '60',
  },
  actionButtonDisabled: {
    opacity: 0.35,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
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
    marginBottom: 4,
  },
})
