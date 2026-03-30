import fr from './fr'
import en from './en'
import { Language } from '@jessy/domain'

export type Translations = typeof fr

export const translations: Record<Language, Translations> = {
  [Language.French]: fr,
  [Language.English]: en,
}
