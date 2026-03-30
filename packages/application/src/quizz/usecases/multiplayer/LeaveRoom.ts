import { createAsyncThunk } from '@reduxjs/toolkit'
import { ThunkApi } from '../../type'

export const leaveRoom = createAsyncThunk<void, { roomName: string }, ThunkApi>(
  'multiplayer/leaveRoom',
  async ({ roomName }, thunkApi) => {
    thunkApi.extra.services.multiplayerSocket.leaveRoom(roomName)
    thunkApi.extra.services.multiplayerSocket.removeAllGameListeners()
  }
)
