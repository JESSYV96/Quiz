import { PayloadAction } from '@reduxjs/toolkit'
import { QuizzState } from '../../type'
import { Language } from '@jessy/domain'

export function selectLanguage(state: QuizzState, action: PayloadAction<Language>) {
  state.settings.language = action.payload
  return state
}
