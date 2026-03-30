import { StyleSheet, View, Pressable } from 'react-native'
import React from 'react'
import Themes from '../../constants/Themes'
import AppText from '../themes/Text'
import { MULTIPLAYER_QUIZ_REQUIRED_NUMBER, Room } from '@jessy/domain'
import Ionicons from '@expo/vector-icons/Ionicons'

interface RoomItemProps {
  room: Room
  onPress: () => void
}

const RoomItem = ({ room, onPress }: RoomItemProps) => {
  const isFull = room.userAmount >= MULTIPLAYER_QUIZ_REQUIRED_NUMBER

  return (
    <Pressable
      onPress={onPress}
      disabled={isFull}
      style={({ pressed }) => [
        styles.card,
        isFull && styles.cardFull,
        pressed && !isFull && styles.cardPressed,
      ]}
    >
      <View style={styles.info}>
        <View style={styles.icon}>
          <Ionicons
            name="game-controller"
            size={18}
            color={isFull ? Themes.colors.gray : Themes.colors.primary}
          />
        </View>
        <View>
          <AppText size={13} color={Themes.colors.text}>
            {room.name}
          </AppText>
          <AppText size={11} color={Themes.colors.gray}>
            {room.userAmount}/{MULTIPLAYER_QUIZ_REQUIRED_NUMBER} joueur(s)
          </AppText>
        </View>
      </View>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isFull
              ? Themes.colors.gray + '20'
              : Themes.colors.primary + '15',
          },
        ]}
      >
        <AppText
          size={11}
          color={isFull ? Themes.colors.gray : Themes.colors.primary}
        >
          {isFull ? 'Complet' : 'Rejoindre'}
        </AppText>
      </View>
    </Pressable>
  )
}

export default RoomItem

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardFull: {
    opacity: 0.6,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Themes.colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
})
