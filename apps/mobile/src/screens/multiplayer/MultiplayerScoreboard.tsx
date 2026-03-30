import React, { useRef, useEffect } from 'react'
import { View, StyleSheet, FlatList, Animated, Pressable } from 'react-native'
import { useSelector } from 'react-redux'
import { appSelectors, appActions } from '@jessy/application'
import DefautLayout from 'src/layouts/DefautLayout'
import AppText from 'src/components/themes/Text'
import Themes from 'src/constants/Themes'
import { useAppDispatch } from 'src/configs/store'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from '../../i18n'

const MultiplayerScoreboardScreen = ({ navigation }: any) => {
  const { multiplayerPlayersSelector } = appSelectors
  const players = useSelector(multiplayerPlayersSelector)
  const dispatch = useAppDispatch()
  const t = useTranslation()

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  const scaleTrophy = useRef(new Animated.Value(0)).current
  const fadeContent = useRef(new Animated.Value(0)).current

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
    ]).start()
  }, [])

  const handleReturn = () => {
    dispatch(appActions.multiplayerReset())
    navigation.navigate('Home')
  }

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '\u{1F947}'
    if (index === 1) return '\u{1F948}'
    if (index === 2) return '\u{1F949}'
    return null
  }

  return (
    <DefautLayout>
      <View style={styles.decoCircleTop} />
      <View style={styles.decoCircleBottom} />

      <View style={styles.container}>
        <Animated.Text
          style={[styles.trophy, { transform: [{ scale: scaleTrophy }] }]}
        >
          {'\u{1F3C6}'}
        </Animated.Text>

        <AppText size={24} color={Themes.colors.text}>
          {t.multiplayer.results}
        </AppText>

        <Animated.View style={[styles.listContainer, { opacity: fadeContent }]}>
          <FlatList
            data={sortedPlayers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.playerList}
            renderItem={({ item, index }) => {
              const isWinner = index === 0
              return (
                <View
                  style={[
                    styles.playerItem,
                    isWinner && styles.winnerItem,
                  ]}
                >
                  <View
                    style={[
                      styles.rankCircle,
                      isWinner && styles.winnerRank,
                    ]}
                  >
                    {getMedalEmoji(index) ? (
                      <AppText size={18}>{getMedalEmoji(index)}</AppText>
                    ) : (
                      <AppText size={16} color={Themes.colors.gray}>
                        {index + 1}
                      </AppText>
                    )}
                  </View>
                  <View style={styles.playerInfo}>
                    <AppText size={14} color={isWinner ? '#fff' : Themes.colors.text}>
                      {t.multiplayer.player(index + 1)}
                    </AppText>
                  </View>
                  <View style={[styles.scoreBadge, isWinner && styles.winnerScoreBadge]}>
                    <AppText
                      size={16}
                      color={isWinner ? Themes.colors.primary : Themes.colors.primary}
                    >
                      {item.score} {t.multiplayer.pts}
                    </AppText>
                  </View>
                </View>
              )
            }}
          />
        </Animated.View>

        <Pressable
          onPress={handleReturn}
          style={({ pressed }) => [
            styles.homeButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="home" size={20} color="#fff" />
            <AppText color="white" size={16}>
              {t.multiplayer.backToHome}
            </AppText>
          </View>
        </Pressable>
      </View>
    </DefautLayout>
  )
}

export default MultiplayerScoreboardScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    gap: 16,
    paddingBottom: 32,
  },
  trophy: {
    fontSize: 72,
  },
  listContainer: {
    width: '100%',
    flex: 1,
  },
  playerList: {
    gap: 10,
    paddingTop: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  winnerItem: {
    backgroundColor: Themes.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  rankCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Themes.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  winnerRank: {
    backgroundColor: '#ffffff30',
  },
  playerInfo: {
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: Themes.colors.primary + '15',
  },
  winnerScoreBadge: {
    backgroundColor: '#ffffff30',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: Themes.colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  decoCircleTop: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Themes.colors.secondary + '15',
  },
  decoCircleBottom: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Themes.colors.primary + '12',
  },
})
