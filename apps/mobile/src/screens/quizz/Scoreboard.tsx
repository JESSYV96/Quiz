import { appSelectors, appActions } from '@jessy/application'
import React, { useRef, useEffect } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { useSelector } from 'react-redux'
import DefautLayout from '../../layouts/DefautLayout'
import { useAppDispatch } from '../../configs/store'
import Themes from '../../constants/Themes'
import AppText from '../../components/themes/Text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'

const ScoreboardScreen = ({ navigation }: any) => {
  const { scoreSelector, totalQuestionSelector } = appSelectors
  const { initQuizz } = appActions

  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const score = useSelector(scoreSelector)
  const total = useSelector(totalQuestionSelector)

  const scaleTrophy = useRef(new Animated.Value(0)).current
  const fadeContent = useRef(new Animated.Value(0)).current
  const slideBtn = useRef(new Animated.Value(30)).current
  const fadeBtn = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleTrophy, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeContent, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(slideBtn, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeBtn, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [])

  const goToHome = () => {
    dispatch(initQuizz())
    navigation.replace('Home')
  }

  const getScoreMessage = () => {
    const ratio = total > 0 ? score / total : 0
    if (ratio === 1) return t('scoreboard.perfect')
    if (ratio >= 0.7) return t('scoreboard.wellPlayed')
    if (ratio >= 0.4) return t('scoreboard.notBad')
    return t('scoreboard.tryAgain')
  }

  const getScoreEmoji = () => {
    const ratio = total > 0 ? score / total : 0
    if (ratio === 1) return '\u{1F3C6}'
    if (ratio >= 0.7) return '\u{1F389}'
    if (ratio >= 0.4) return '\u{1F44D}'
    return '\u{1F4AA}'
  }

  return (
    <DefautLayout>
      <View style={styles.decoCircleTop} />
      <View style={styles.decoCircleBottom} />

      <View style={styles.container}>
        <Animated.Text
          style={[styles.trophy, { transform: [{ scale: scaleTrophy }] }]}
        >
          {getScoreEmoji()}
        </Animated.Text>

        <Animated.View style={[styles.scoreCard, { opacity: fadeContent }]}>
          <AppText size={14} color={Themes.colors.gray}>
            {t('scoreboard.yourScore')}
          </AppText>
          <View style={styles.scoreRow}>
            <AppText size={48} color={Themes.colors.primary}>
              {score}
            </AppText>
            <AppText size={20} color={Themes.colors.gray}>
              pts
            </AppText>
          </View>
          <AppText size={16} color={Themes.colors.text}>
            {getScoreMessage()}
          </AppText>
        </Animated.View>

        <Animated.View
          style={{
            width: '100%',
            opacity: fadeBtn,
            transform: [{ translateY: slideBtn }],
          }}
        >
          <Pressable
            onPress={goToHome}
            style={({ pressed }) => [
              styles.homeButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="home" size={20} color="#fff" />
              <AppText color="white" size={16}>
                {t('scoreboard.backToHome')}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ffffff90" />
          </Pressable>

          <Pressable
            onPress={() => {
              dispatch(initQuizz())
              navigation.replace('Quizz')
            }}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="refresh" size={20} color={Themes.colors.primary} />
              <AppText color={Themes.colors.primary} size={16}>
                {t('scoreboard.playAgain')}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Themes.colors.primary + '60'} />
          </Pressable>
        </Animated.View>
      </View>
    </DefautLayout>
  )
}

export default ScoreboardScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingBottom: 32,
  },
  trophy: {
    fontSize: 80,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    width: '100%',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    gap: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: Themes.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Themes.colors.primary,
    marginTop: 12,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  decoCircleTop: {
    position: 'absolute',
    top: -80,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Themes.colors.secondary + '15',
  },
  decoCircleBottom: {
    position: 'absolute',
    bottom: -60,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Themes.colors.primary + '12',
  },
})
