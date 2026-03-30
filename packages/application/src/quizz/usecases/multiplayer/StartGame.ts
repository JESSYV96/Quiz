import { createAsyncThunk } from '@reduxjs/toolkit'
import { ThunkApi } from '../../type'

export const startGame = createAsyncThunk<void, { roomName: string }, ThunkApi>(
  'multiplayer/startGame',
  async ({ roomName }, thunkApi) => {
    thunkApi.extra.services.multiplayerSocket.startGame(roomName)
  }
)
