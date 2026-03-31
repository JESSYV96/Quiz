import { StyleSheet, Pressable, View } from 'react-native'
import React, { useRef, useEffect } from 'react'
import { Animated } from 'react-native'
import Themes from '../../constants/Themes'
import AppText from '../themes/Text'
import { appActions, appSelectors } from '@jessy/application'
import { useAppDispatch } from '../../configs/store'
import { useSelector } from 'react-redux'
import Ionicons from '@expo/vector-icons/Ionicons'

interface AnswerItemProps {
  text: string
  letter: string
  shouldCheckAnswer: boolean
  index: number
}

const AnswerItem = ({ letter, text, shouldCheckAnswer, index }: AnswerItemProps) => {
  const dispatch = useAppDispatch()
  const { selectAnswer } = appActions
  const { hasAnsweredSelector, currentQuestionSelector } = appSelectors

  const hasAnsweredQuestion = useSelector(hasAnsweredSelector)
  const currentQuestion = useSelector(currentQuestionSelector)

  const slideIn = useRef(new Animated.Value(30)).current
  const fadeIn = useRef(new Animated.Value(0)).current

  useEffect(() => {
    slideIn.setValue(30)
    fadeIn.setValue(0)
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(slideIn, {
        toValue: 0,
        friction: 8,
        tension: 50,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start()
  }, [currentQuestion?.label])

  const isRightAnswer = currentQuestion?.correctAnswer === text
  const isWrongSelected = shouldCheckAnswer && hasAnsweredQuestion && !isRightAnswer
  const isCorrectRevealed = hasAnsweredQuestion && isRightAnswer

  const getContainerStyle = () => {
    if (isCorrectRevealed) {
      return {
        backgroundColor: Themes.colors.primary + '18',
        borderColor: Themes.colors.primary,
      }
    }
    if (isWrongSelected) {
      return {
        backgroundColor: Themes.colors.danger + '12',
        borderColor: Themes.colors.danger,
      }
    }
    if (shouldCheckAnswer) {
      return {
        backgroundColor: Themes.colors.primary + '10',
        borderColor: Themes.colors.primary + '80',
      }
    }
    return {
      backgroundColor: '#fff',
      borderColor: Themes.colors.text + '12',
    }
  }

  const getLetterStyle = () => {
    if (isCorrectRevealed) {
      return {
        backgroundColor: Themes.colors.primary,
        color: '#fff',
      }
    }
    if (isWrongSelected) {
      return {
        backgroundColor: Themes.colors.danger,
        color: '#fff',
      }
    }
    if (shouldCheckAnswer) {
      return {
        backgroundColor: Themes.colors.primary + '20',
        color: Themes.colors.primary,
      }
    }
    return {
      backgroundColor: Themes.colors.text + '08',
      color: Themes.colors.gray,
    }
  }

  const getIcon = () => {
    if (isCorrectRevealed) {
      return <Ionicons name="checkmark-circle" size={20} color={Themes.colors.primary} />
    }
    if (isWrongSelected) {
      return <Ionicons name="close-circle" size={20} color={Themes.colors.danger} />
    }
    return null
  }

  const containerDynamic = getContainerStyle()
  const letterDynamic = getLetterStyle()

  return (
    <Animated.View
      style={{
        opacity: fadeIn,
        transform: [{ translateX: slideIn }],
      }}
    >
      <Pressable
        onPress={() => {
          if (!hasAnsweredQuestion && !shouldCheckAnswer) {
            dispatch(selectAnswer(text))
          }
        }}
        disabled={shouldCheckAnswer || hasAnsweredQuestion}
        style={({ pressed }) => [
          styles.answer,
          {
            backgroundColor: containerDynamic.backgroundColor,
            borderColor: containerDynamic.borderColor,
          },
          pressed && !hasAnsweredQuestion && styles.answerPressed,
        ]}
      >
        <View style={styles.answerLeft}>
          <View
            style={[
              styles.letterBadge,
              { backgroundColor: letterDynamic.backgroundColor },
            ]}
          >
            <AppText color={letterDynamic.color} size={12}>
              {letter}
            </AppText>
          </View>
          <AppText color={Themes.colors.text} size={13}>
            {text}
          </AppText>
        </View>
        {getIcon()}
      </Pressable>
    </Animated.View>
  )
}

export default AnswerItem

const styles = StyleSheet.create({
  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  answerPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  answerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  letterBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
