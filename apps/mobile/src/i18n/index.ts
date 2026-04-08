import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { TranslateClient } from '@kiweeapp/sdk'
import { resources } from './translations'

const client = new TranslateClient({
  apiUrl: process.env.EXPO_PUBLIC_KIWEE_API_URL!,
  projectSlug: process.env.EXPO_PUBLIC_KIWEE_PROJECT_SLUG!,
  apiKey: process.env.EXPO_PUBLIC_KIWEE_API_KEY!,
  defaultLocale: 'fr',
})

i18n.use(initReactI18next).init({
  resources,
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
})

client.load('fr').then(() => {
  const remote = client.getCache().get('fr')
  if (remote) {
    i18n.addResourceBundle('fr', 'translation', remote, true, true)
    i18n.changeLanguage('fr')
  }
})


export default i18n
