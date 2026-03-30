import { StyleSheet, Text, View, Pressable, Animated, Dimensions } from 'react-native'
import { useRef, useEffect } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import Themes from '../constants/Themes'
import DefautLayout from '../layouts/DefautLayout'
import CircularButton from '../components/themes/buttons/CircularButton'
import { useTranslation } from '../i18n'

const { width } = Dimensions.get('window')

interface HomeScreenProps {
  navigation: any
}

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const t = useTranslation()
  const fadeTitle = useRef(new Animated.Value(0)).current
  const fadeSubtitle = useRef(new Animated.Value(0)).current
  const slideBtn1 = useRef(new Animated.Value(40)).current
  const fadeBtn1 = useRef(new Animated.Value(0)).current
  const slideBtn2 = useRef(new Animated.Value(40)).current
  const fadeBtn2 = useRef(new Animated.Value(0)).current
  const scaleEmoji = useRef(new Animated.Value(0.3)).current
  const fadeEmoji = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleEmoji, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeEmoji, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(fadeTitle, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeSubtitle, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(slideBtn1, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeBtn1, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(slideBtn2, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeBtn2, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [])

  return (
    <DefautLayout>
      {/* Decorative shapes */}
      <View style={styles.decoCircleTopLeft} />
      <View style={styles.decoCircleBottomRight} />
      <View style={styles.decoDotMid} />

      {/* Header */}
      <View style={styles.header}>
        <CircularButton onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="white" />
        </CircularButton>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Animated.Text
          style={[
            styles.emoji,
            { opacity: fadeEmoji, transform: [{ scale: scaleEmoji }] },
          ]}
        >
          {'\u{1F9E0}'}
        </Animated.Text>

        <Animated.Text style={[styles.title, { opacity: fadeTitle }]}>
          QUIZZ
        </Animated.Text>
        <Animated.Text style={[styles.titleAccent, { opacity: fadeTitle }]}>
          APP
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: fadeSubtitle }]}>
          {t.home.subtitle}
        </Animated.Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Animated.View
          style={{
            opacity: fadeBtn1,
            transform: [{ translateY: slideBtn1 }],
          }}
        >
          <Pressable
            onPress={() => navigation.replace('Quizz')}
            style={({ pressed }) => [
              styles.mainButton,
              styles.soloButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="flash" size={22} color="#fff" />
              <Text style={styles.buttonText}>{t.home.playSolo}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ffffff90" />
          </Pressable>
        </Animated.View>

        <Animated.View
          style={{
            opacity: fadeBtn2,
            transform: [{ translateY: slideBtn2 }],
          }}
        >
          <Pressable
            onPress={() => navigation.replace('MultiplayerHome')}
            style={({ pressed }) => [
              styles.mainButton,
              styles.multiButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="people" size={22} color="#fff" />
              <Text style={styles.buttonText}>{t.home.multiplayer}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ffffff90" />
          </Pressable>
        </Animated.View>
      </View>
    </DefautLayout>
  )
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginTop: 15,
    zIndex: 10,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Lemon-Milk',
    fontSize: 48,
    color: Themes.colors.primary,
    letterSpacing: 6,
    lineHeight: 52,
  },
  titleAccent: {
    fontFamily: 'Lemon-Milk',
    fontSize: 48,
    color: Themes.colors.secondary,
    letterSpacing: 12,
    lineHeight: 52,
    marginTop: -4,
  },
  subtitle: {
    fontFamily: 'Lemon-Milk',
    fontSize: 13,
    color: Themes.colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
    letterSpacing: 1,
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
  soloButton: {
    backgroundColor: Themes.colors.primary,
  },
  multiButton: {
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
  buttonText: {
    fontFamily: 'Lemon-Milk',
    fontSize: 16,
    color: '#fff',
    letterSpacing: 1,
  },
  // Decorative elements
  decoCircleTopLeft: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Themes.colors.primary + '12',
  },
  decoCircleBottomRight: {
    position: 'absolute',
    bottom: -40,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Themes.colors.secondary + '15',
  },
  decoDotMid: {
    position: 'absolute',
    top: '35%',
    left: 30,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Themes.colors.primary + '30',
  },
})

export default HomeScreen
