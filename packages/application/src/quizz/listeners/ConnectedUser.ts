import { createAsyncThunk } from '@reduxjs/toolkit'
import { ThunkApi } from '../type'

export const userConnectedListener = createAsyncThunk<
  void,
  undefined,
  ThunkApi
>('multiplayer/userConnected', async (_, thunkApi) => {
  thunkApi.extra.services.multiplayerSocket.onUserConnected((data) => {
    console.log('user connected', data)
  })
})
