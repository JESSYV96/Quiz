import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, ActivityIndicator, Animated, Dimensions } from 'react-native'
import { useSelector } from 'react-redux'

import { appSelectors, getQuestions, appActions } from '@jessy/application'
import CircularButton from '../../components/themes/buttons/CircularButton'
import DefautLayout from '../../layouts/DefautLayout'
import Ionicons from '@expo/vector-icons/Ionicons'
import AppText from '../../components/themes/Text'
import { useAppDispatch } from '../../configs/store'
import QuestionCard from '../../components/quizz/QuestionCard'
import Themes from 'src/constants/Themes'
import { useTranslation } from 'react-i18next'

const { width } = Dimensions.get('window')

interface QuizzScreenProps {
  navigation: any
}

const QuizzScreen = ({ navigation }: QuizzScreenProps) => {
  const {
    questionsSelector,
    scoreSelector,
    difficultySelector,
    totalQuestionSelector,
    currentQuestionIndexSelector,
    answersSelector,
    isEndOfQuizzSelector,
    isQuizLoadingSelector
  } = appSelectors

  const { selectQuestion, shuffleAnswers, selectAnswer, selectQuestionMode } = appActions

  const questions = useSelector(questionsSelector)
  const score = useSelector(scoreSelector)
  const currentQuestionIndex = useSelector(currentQuestionIndexSelector)
  const totalQuestion = useSelector(totalQuestionSelector)
  const isEndOfQuiz = useSelector(isEndOfQuizzSelector)
  const difficulty = useSelector(difficultySelector)
  const isQuizLoading = useSelector(isQuizLoadingSelector)

  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const fadeIn = useRef(new Animated.Value(0)).current
  const slideUp = useRef(new Animated.Value(40)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    dispatch(getQuestions({ difficulty }))
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    if (totalQuestion > 0) {
      Animated.spring(progressAnim, {
        toValue: (currentQuestionIndex + 1) / totalQuestion,
        friction: 8,
        tension: 50,
        useNativeDriver: false,
      }).start()
    }
  }, [currentQuestionIndex, totalQuestion])

  useEffect(() => {
    if (questions.length && isEndOfQuiz) {
      navigation.navigate('Scoreboard')
    }
    if (questions.length && !isEndOfQuiz) {
      dispatch(selectQuestion(questions[currentQuestionIndex]))
      dispatch(shuffleAnswers({ randomNumber: Math.random() }))
    }
    return () => {
      dispatch(selectAnswer(null))
      dispatch(selectQuestionMode(false))
    }
  }, [questions, currentQuestionIndex])

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <DefautLayout>
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeIn, transform: [{ translateY: slideUp }] },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <CircularButton
            onPress={() => navigation.navigate('Home')}
            color={Themes.colors.text + '08'}
            size={42}
          >
            <Ionicons name="close" size={22} color={Themes.colors.text} />
          </CircularButton>

          <View style={styles.headerCenter}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>
            <AppText color={Themes.colors.gray} size={11}>
              {currentQuestionIndex + 1} / {totalQuestion}
            </AppText>
          </View>

          <View style={styles.scoreBadge}>
            <Ionicons name="star" size={14} color={Themes.colors.secondary} />
            <AppText color={Themes.colors.text} size={13}>
              {score} pts
            </AppText>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isQuizLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Themes.colors.primary} />
              <AppText color={Themes.colors.gray} size={13}>
                {t('game.loading')}
              </AppText>
            </View>
          ) : (
            <QuestionCard />
          )}
        </View>
      </Animated.View>
    </DefautLayout>
  )
}

export default QuizzScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Themes.colors.text + '0A',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Themes.colors.primary,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Themes.colors.secondary + '25',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
})
