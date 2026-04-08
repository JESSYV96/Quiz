import { StyleSheet, View, Pressable } from 'react-native'
import DefautLayout from '../../layouts/DefautLayout'
import { Picker } from '@react-native-picker/picker'
import { Difficulty, Effect, Language } from '@jessy/domain'
import { useSelector } from 'react-redux'
import { appActions, appSelectors } from '@jessy/application'
import { useAppDispatch } from '../../configs/store'
import Themes from '../../constants/Themes'
import AppText from '../../components/themes/Text'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTranslation } from 'react-i18next'

const SettingsScreen = ({ navigation }: any) => {
  const { difficultySelector, effectSelector, languageSelector } = appSelectors
  const { selectDifficulty, selectEffect, selectLanguage } = appActions

  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const difficuly = useSelector(difficultySelector)
  const effect = useSelector(effectSelector)
  const language = useSelector(languageSelector)

  return (
    <DefautLayout>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Themes.colors.text} />
        </Pressable>
        <AppText size={20} color={Themes.colors.text}>
          {t('settings.title')}
        </AppText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="speedometer-outline" size={22} color={Themes.colors.primary} />
            <AppText size={15} color={Themes.colors.text}>
              {t('settings.difficulty')}
            </AppText>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={difficuly}
              onValueChange={(itemValue) => {
                dispatch(selectDifficulty(itemValue))
              }}
              style={styles.picker}
            >
              {Object.entries(Difficulty).map(([key, value]) => (
                <Picker.Item key={key} label={t(`enums.difficulty.${key}`) ?? key} value={value} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles-outline" size={22} color={Themes.colors.secondary} />
            <AppText size={15} color={Themes.colors.text}>
              {t('settings.effect')}
            </AppText>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={effect}
              onValueChange={(itemValue) => {
                dispatch(selectEffect(itemValue))
              }}
              style={styles.picker}
            >
              {Object.entries(Effect).map(([key, value]) => (
                <Picker.Item key={key} label={t(`enums.effect.${key}`) ?? key} value={value} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="globe-outline" size={22} color={Themes.colors.primary} />
            <AppText size={15} color={Themes.colors.text}>
              {t('settings.language')}
            </AppText>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={language}
              onValueChange={(itemValue) => {
                dispatch(selectLanguage(itemValue))
              }}
              style={styles.picker}
            >
              {Object.entries(Language).map(([key, value]) => (
                <Picker.Item key={key} label={t(`enums.language.${key}`) ?? key} value={value} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    </DefautLayout>
  )
}

export default SettingsScreen

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: Themes.colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
})
