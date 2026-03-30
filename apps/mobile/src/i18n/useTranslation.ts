import { useSelector } from 'react-redux'
import { appSelectors } from '@jessy/application'
import { translations, Translations } from './translations'

export function useTranslation(): Translations {
  const language = useSelector(appSelectors.languageSelector)
  return translations[language]
}
