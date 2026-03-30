import React, { useEffect } from 'react'
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native'
import { useSelector } from 'react-redux'

import { appSelectors, getQuestions, appActions } from '@jessy/application'
import CircularButton from '../../components/themes/buttons/CircularButton'
import DefautLayout from '../../layouts/DefautLayout'
import Ionicons from '@expo/vector-icons/Ionicons'
import AppText from '../../components/themes/Text'
import { useAppDispatch } from '../../configs/store'
import QuestionCard from '../../components/quizz/QuestionCard'
import Themes from 'src/constants/Themes'
import { useTranslation } from '../../i18n'

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
  const answers = useSelector(answersSelector)
  const score = useSelector(scoreSelector)
  const currentQuestionIndex = useSelector(currentQuestionIndexSelector)
  const totalQuestion = useSelector(totalQuestionSelector)
  const isEndOfQuiz = useSelector(isEndOfQuizzSelector)
  const difficulty = useSelector(difficultySelector)
  const isQuizLoading = useSelector(isQuizLoadingSelector)

  const dispatch = useAppDispatch()
  const t = useTranslation()

  useEffect(() => {
    dispatch(getQuestions({ difficulty }))
  }, [])

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

  return (
    <DefautLayout>
      <View style={styles.header}>
        <CircularButton onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back-outline" size={24} color="white" />
        </CircularButton>
        <AppText color="black">
          {t.game.question(currentQuestionIndex + 1, totalQuestion)}
        </AppText>
        <Text>{t.game.score(score)}</Text>
      </View>
      <View>
        {isQuizLoading ? <ActivityIndicator color={Themes.colors.primary} /> : <QuestionCard />}
      </View>
    </DefautLayout>
  )
}

export default QuizzScreen

const styles = StyleSheet.create({
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15
  }
})
