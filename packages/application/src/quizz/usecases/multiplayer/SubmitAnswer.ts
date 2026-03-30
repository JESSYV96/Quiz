import { createAsyncThunk } from '@reduxjs/toolkit'
import { ThunkApi } from '../../type'

export const multiplayerSubmitAnswer = createAsyncThunk<
  void,
  { roomName: string; answer: string },
  ThunkApi
>('multiplayer/submitAnswer', async ({ roomName, answer }, thunkApi) => {
  thunkApi.extra.services.multiplayerSocket.submitAnswer(roomName, answer)
})
