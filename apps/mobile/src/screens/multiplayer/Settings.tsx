import { useEffect } from 'react'
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { appSelectors, setupGameListeners, startGame, leaveRoom } from '@jessy/application'
import { useSelector } from 'react-redux'
import { useAppDispatch } from 'src/configs/store'
import DefautLayout from 'src/layouts/DefautLayout'
import Themes from 'src/constants/Themes'
import AppText from 'src/components/themes/Text'
import Ionicons from '@expo/vector-icons/Ionicons'
import CircularButton from 'src/components/themes/buttons/CircularButton'
import { Pressable } from 'react-native'
import { useTranslation } from 'react-i18next'

const MultiplayerSettingsScreen = ({ navigation }: any) => {
  const {
    hasRequiredPlayerSelector,
    roomSelector,
    multiplayerGameStatusSelector,
    multiplayerPlayersSelector,
    isAdminSelector,
  } = appSelectors

  const hasRequiredPlayer = useSelector(hasRequiredPlayerSelector)
  const room = useSelector(roomSelector)
  const gameStatus = useSelector(multiplayerGameStatusSelector)
  const players = useSelector(multiplayerPlayersSelector)
  const isAdmin = useSelector(isAdminSelector)
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  useEffect(() => {
    dispatch(setupGameListeners())
  }, [])

  useEffect(() => {
    if (gameStatus === 'playing') {
      navigation.navigate('MultiplayerGame')
    }
  }, [gameStatus])

  const handleStartGame = () => {
    if (room) {
      dispatch(startGame({ roomName: room.name }))
    }
  }

  const handleLeaveRoom = () => {
    if (room) {
      dispatch(leaveRoom({ roomName: room.name }))
      navigation.navigate('MultiplayerHome')
    }
  }

  if (!room) {
    return (
      <DefautLayout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Themes.colors.primary} />
        </View>
      </DefautLayout>
    )
  }

  return (
    <DefautLayout>
      <View style={styles.header}>
        <CircularButton onPress={handleLeaveRoom}>
          <Ionicons name="arrow-back-outline" size={24} color="white" />
        </CircularButton>
        <AppText size={18} color={Themes.colors.text}>
          {t('multiplayer.room')}
        </AppText>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.roomCard}>
        <View style={styles.roomIconBig}>
          <Ionicons name="game-controller" size={28} color={Themes.colors.primary} />
        </View>
        <AppText size={20} color={Themes.colors.text}>
          {room.name}
        </AppText>
        <AppText size={13} color={Themes.colors.gray}>
          {t('multiplayer.connected', { count: room.userAmount })}
        </AppText>
      </View>

      <View style={styles.playerSection}>
        <AppText size={15} color={Themes.colors.text}>
          {t('multiplayer.players')}
        </AppText>
        <FlatList
          data={players}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.playerList}
          renderItem={({ item, index }) => (
            <View style={styles.playerItem}>
              <View style={styles.playerAvatar}>
                <AppText size={14} color="#fff">
                  J{index + 1}
                </AppText>
              </View>
              <AppText size={14} color={Themes.colors.text}>
                {t('multiplayer.player', { index: index + 1 })}{item.id === room.playerId ? ` ${t('multiplayer.me')}` : ''}
              </AppText>
              {item.id === room.adminId && (
                <View style={styles.adminBadge}>
                  <AppText size={10} color={Themes.colors.secondary}>
                    {t('multiplayer.admin')}
                  </AppText>
                </View>
              )}
            </View>
          )}
        />
      </View>

      {!hasRequiredPlayer && (
        <View style={styles.waitingBanner}>
          <ActivityIndicator size="small" color={Themes.colors.primary} />
          <AppText size={13} color={Themes.colors.gray}>
            {t('multiplayer.waitingPlayers')}
          </AppText>
        </View>
      )}

      <View style={styles.footer}>
        {isAdmin && (
          <Pressable
            onPress={handleStartGame}
            disabled={!hasRequiredPlayer}
            style={({ pressed }) => [
              styles.startButton,
              !hasRequiredPlayer && styles.startButtonDisabled,
              pressed && hasRequiredPlayer && styles.buttonPressed,
            ]}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="play" size={22} color="#fff" />
              <AppText color="white" size={16}>
                {t('multiplayer.startGame')}
              </AppText>
            </View>
          </Pressable>
        )}

        <Pressable
          onPress={handleLeaveRoom}
          style={({ pressed }) => [
            styles.leaveButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="exit-outline" size={20} color={Themes.colors.danger} />
            <AppText color={Themes.colors.danger} size={14}>
              {t('multiplayer.leave')}
            </AppText>
          </View>
        </Pressable>
      </View>
    </DefautLayout>
  )
}

export default MultiplayerSettingsScreen

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    gap: 8,
  },
  roomIconBig: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Themes.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  playerSection: {
    marginTop: 24,
    gap: 12,
    flex: 1,
  },
  playerList: {
    gap: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Themes.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Themes.colors.secondary + '20',
  },
  waitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    marginTop: 12,
    backgroundColor: Themes.colors.primary + '10',
    borderRadius: 12,
  },
  footer: {
    paddingBottom: 32,
    paddingTop: 16,
    gap: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  startButtonDisabled: {
    opacity: 0.4,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: Themes.colors.danger + '10',
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
})
