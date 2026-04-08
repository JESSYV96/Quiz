import { appSelectors, getActiveRooms, joinRoom, setupRoomsListener, removeRoomsListener } from '@jessy/application'
import { useEffect } from 'react'
import { View, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { useSelector } from 'react-redux'
import { useAppDispatch } from 'src/configs/store'
import DefautLayout from 'src/layouts/DefautLayout'
import Themes from 'src/constants/Themes'
import AppText from 'src/components/themes/Text'
import Ionicons from '@expo/vector-icons/Ionicons'
import CircularButton from 'src/components/themes/buttons/CircularButton'
import { MULTIPLAYER_QUIZ_REQUIRED_NUMBER } from '@jessy/domain'
import { useTranslation } from 'react-i18next'

const RoomListScreen = ({ navigation }: any) => {
  const { activeRoomsSelector } = appSelectors
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const activeRooms = useSelector(activeRoomsSelector)

  useEffect(() => {
    dispatch(getActiveRooms())
    dispatch(setupRoomsListener())
    return () => {
      dispatch(removeRoomsListener())
    }
  }, [])

  const handleJoinRoom = async (roomName: string) => {
    await dispatch(joinRoom({ roomName })).unwrap()
    navigation.navigate('MultiplayerSettings')
  }

  return (
    <DefautLayout>
      <View style={styles.header}>
        <CircularButton onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={24} color="white" />
        </CircularButton>
        <AppText size={18} color={Themes.colors.text}>
          {t('multiplayer.availableRooms')}
        </AppText>
        <CircularButton onPress={() => dispatch(getActiveRooms())}>
          <Ionicons name="refresh" size={22} color="white" />
        </CircularButton>
      </View>

      {activeRooms.length === 0 ? (
        <View style={styles.emptyState}>
          <AppText size={48}>{'\u{1F50D}'}</AppText>
          <AppText size={16} color={Themes.colors.gray}>
            {t('multiplayer.noRooms')}
          </AppText>
          <AppText size={13} color={Themes.colors.gray}>
            {t('multiplayer.noRoomsHint')}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={activeRooms}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isFull = item.userAmount >= MULTIPLAYER_QUIZ_REQUIRED_NUMBER
            return (
              <Pressable
                onPress={() => !isFull && handleJoinRoom(item.name)}
                disabled={isFull}
                style={({ pressed }) => [
                  styles.roomCard,
                  isFull && styles.roomCardFull,
                  pressed && !isFull && styles.roomCardPressed,
                ]}
              >
                <View style={styles.roomInfo}>
                  <View style={styles.roomIcon}>
                    <Ionicons
                      name="game-controller"
                      size={20}
                      color={isFull ? Themes.colors.gray : Themes.colors.primary}
                    />
                  </View>
                  <View>
                    <AppText size={14} color={Themes.colors.text}>
                      {item.name}
                    </AppText>
                    <AppText size={12} color={Themes.colors.gray}>
                      {t('multiplayer.playerCount', { current: item.userAmount, max: MULTIPLAYER_QUIZ_REQUIRED_NUMBER })}
                    </AppText>
                  </View>
                </View>
                <View
                  style={[
                    styles.joinBadge,
                    { backgroundColor: isFull ? Themes.colors.gray + '20' : Themes.colors.primary + '15' },
                  ]}
                >
                  <AppText
                    size={12}
                    color={isFull ? Themes.colors.gray : Themes.colors.primary}
                  >
                    {isFull ? t('multiplayer.full') : t('multiplayer.join')}
                  </AppText>
                </View>
              </Pressable>
            )
          }}
        />
      )}
    </DefautLayout>
  )
}

export default RoomListScreen

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 20,
  },
  list: {
    gap: 12,
    paddingBottom: 32,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  roomCardFull: {
    opacity: 0.6,
  },
  roomCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  roomIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Themes.colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
})
