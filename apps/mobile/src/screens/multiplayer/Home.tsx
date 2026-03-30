import { View, StyleSheet, Pressable, Animated } from 'react-native'
import { useRef, useEffect } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import AppText from 'src/components/themes/Text'
import { useAppDispatch } from 'src/configs/store'
import { createRoom } from '@jessy/application'
import DefautLayout from 'src/layouts/DefautLayout'
import Themes from 'src/constants/Themes'
import CircularButton from 'src/components/themes/buttons/CircularButton'
import { useTranslation } from '../../i18n'

const MultiplayerHomeScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch()
  const t = useTranslation()

  const fadeTitle = useRef(new Animated.Value(0)).current
  const slideBtn1 = useRef(new Animated.Value(30)).current
  const fadeBtn1 = useRef(new Animated.Value(0)).current
  const slideBtn2 = useRef(new Animated.Value(30)).current
  const fadeBtn2 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeTitle, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(slideBtn1, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(fadeBtn1, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(slideBtn2, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(fadeBtn2, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start()
  }, [])

  return (
    <DefautLayout>
      <View style={styles.decoCircleTopRight} />
      <View style={styles.decoCircleBottomLeft} />

      <View style={styles.header}>
        <CircularButton onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back-outline" size={24} color="white" />
        </CircularButton>
      </View>

      <View style={styles.body}>
        <Animated.Text style={[styles.emoji, { opacity: fadeTitle }]}>
          {'\u{1F3AE}'}
        </Animated.Text>
        <Animated.View style={{ opacity: fadeTitle, alignItems: 'center', gap: 8 }}>
          <AppText size={28} color={Themes.colors.text}>
            {t.multiplayer.title}
          </AppText>
          <AppText size={13} color={Themes.colors.gray}>
            {t.multiplayer.subtitle}
          </AppText>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Animated.View style={{ opacity: fadeBtn1, transform: [{ translateY: slideBtn1 }] }}>
          <Pressable
            onPress={() => {
              dispatch(createRoom())
              navigation.navigate('MultiplayerSettings')
            }}
            style={({ pressed }) => [
              styles.mainButton,
              styles.createButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="add-circle" size={22} color="#fff" />
              <AppText color="white" size={16}>
                {t.multiplayer.createGame}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ffffff90" />
          </Pressable>
        </Animated.View>

        <Animated.View style={{ opacity: fadeBtn2, transform: [{ translateY: slideBtn2 }] }}>
          <Pressable
            onPress={() => navigation.navigate('MultiplayerRooms')}
            style={({ pressed }) => [
              styles.mainButton,
              styles.joinButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="enter" size={22} color="#fff" />
              <AppText color="white" size={16}>
                {t.multiplayer.joinGame}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ffffff90" />
          </Pressable>
        </Animated.View>
      </View>
    </DefautLayout>
  )
}

export default MultiplayerHomeScreen

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: 15,
    zIndex: 10,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  footer: {
    paddingBottom: 32,
    gap: 14,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  createButton: {
    backgroundColor: Themes.colors.primary,
  },
  joinButton: {
    backgroundColor: Themes.colors.secondary,
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
  decoCircleTopRight: {
    position: 'absolute',
    top: -50,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Themes.colors.secondary + '15',
  },
  decoCircleBottomLeft: {
    position: 'absolute',
    bottom: -50,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Themes.colors.primary + '12',
  },
})
