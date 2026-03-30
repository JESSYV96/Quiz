import { createAsyncThunk } from '@reduxjs/toolkit'
import { ThunkApi } from '../../type/slice'

export const setupRoomsListener = createAsyncThunk<void, undefined, ThunkApi>(
  'multiplayer/setupRoomsListener',
  async (_, thunkApi) => {
    const socket = thunkApi.extra.services.multiplayerSocket

    socket.onRoomsListUpdated((rooms) => {
      thunkApi.dispatch({ type: 'quizz/multiplayerRoomsListUpdated', payload: rooms })
    })
  }
)

export const removeRoomsListener = createAsyncThunk<void, undefined, ThunkApi>(
  'multiplayer/removeRoomsListener',
  async (_, thunkApi) => {
    const socket = thunkApi.extra.services.multiplayerSocket
    socket.removeRoomsListListener()
  }
)
