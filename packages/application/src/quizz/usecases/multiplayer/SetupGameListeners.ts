import { createAsyncThunk } from '@reduxjs/toolkit'
import { ThunkApi } from '../../type/slice'

export const setupGameListeners = createAsyncThunk<void, undefined, ThunkApi>(
  'multiplayer/setupGameListeners',
  async (_, thunkApi) => {
    const socket = thunkApi.extra.services.multiplayerSocket

    socket.onGameStarted(() => {
      thunkApi.dispatch({ type: 'quizz/multiplayerGameStarted' })
    })

    socket.onNewQuestion((payload) => {
      thunkApi.dispatch({ type: 'quizz/multiplayerNewQuestion', payload })
    })

    socket.onPlayerAnswered((payload) => {
      thunkApi.dispatch({ type: 'quizz/multiplayerPlayerAnswered', payload })
    })

    socket.onQuestionResult((payload) => {
      thunkApi.dispatch({ type: 'quizz/multiplayerQuestionResult', payload })
    })

    socket.onGameOver((payload) => {
      thunkApi.dispatch({ type: 'quizz/multiplayerGameOver', payload })
    })

    socket.onRoomUpdated((payload) => {
      thunkApi.dispatch({ type: 'quizz/multiplayerRoomUpdated', payload })
    })

    socket.onUserDisconnected((payload) => {
      thunkApi.dispatch({ type: 'quizz/multiplayerPlayerDisconnected', payload })
    })
  }
)
