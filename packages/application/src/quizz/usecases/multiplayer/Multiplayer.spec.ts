import { expect, it, describe } from 'vitest'
import { quizzSlice, appActions, initialState } from '../../type'

describe('Multiplayer reducers', () => {
  it('multiplayerGameStarted should set status to playing', () => {
    const state = { ...initialState }
    const newState = quizzSlice.reducer(state, appActions.multiplayerGameStarted())

    expect(newState.multiplayer.game.status).toBe('playing')
  })

  it('multiplayerNewQuestion should set question data and reset selection', () => {
    const state = { ...initialState }
    const payload = {
      question: {
        label: 'Test question?',
        type: 'multiple_choice' as const,
        difficulty: 'easy',
        theme: 'Sports',
        answers: ['A', 'B', 'C', 'D'],
      },
      questionIndex: 2,
      totalQuestions: 5,
    }

    const newState = quizzSlice.reducer(state, appActions.multiplayerNewQuestion(payload))

    expect(newState.multiplayer.game.currentQuestion).toEqual(payload.question)
    expect(newState.multiplayer.game.questionIndex).toBe(2)
    expect(newState.multiplayer.game.totalQuestions).toBe(5)
    expect(newState.multiplayer.game.selectedAnswer).toBeNull()
    expect(newState.multiplayer.game.hasSubmitted).toBe(false)
    expect(newState.multiplayer.game.answeredPlayerIds).toEqual([])
    expect(newState.multiplayer.game.questionResult).toBeNull()
    expect(newState.multiplayer.game.status).toBe('playing')
  })

  it('multiplayerSelectAnswer should set selectedAnswer', () => {
    const state = { ...initialState }
    const newState = quizzSlice.reducer(state, appActions.multiplayerSelectAnswer('B'))

    expect(newState.multiplayer.game.selectedAnswer).toBe('B')
  })

  it('multiplayerPlayerAnswered should add playerId to answeredPlayerIds', () => {
    const state = { ...initialState }
    const s1 = quizzSlice.reducer(
      state,
      appActions.multiplayerPlayerAnswered({ playerId: 'p1' })
    )
    const s2 = quizzSlice.reducer(
      s1,
      appActions.multiplayerPlayerAnswered({ playerId: 'p2' })
    )

    expect(s2.multiplayer.game.answeredPlayerIds).toEqual(['p1', 'p2'])
  })

  it('multiplayerPlayerAnswered should not duplicate playerIds', () => {
    const state = { ...initialState }
    const s1 = quizzSlice.reducer(
      state,
      appActions.multiplayerPlayerAnswered({ playerId: 'p1' })
    )
    const s2 = quizzSlice.reducer(
      s1,
      appActions.multiplayerPlayerAnswered({ playerId: 'p1' })
    )

    expect(s2.multiplayer.game.answeredPlayerIds).toEqual(['p1'])
  })

  it('multiplayerQuestionResult should update scores and set showing-result', () => {
    const state = { ...initialState }
    const resultPayload = {
      correctAnswer: 'A',
      players: [
        { id: 'p1', score: 10, hasAnswered: true },
        { id: 'p2', score: 0, hasAnswered: true },
      ],
      questionIndex: 0,
    }

    const newState = quizzSlice.reducer(
      state,
      appActions.multiplayerQuestionResult(resultPayload)
    )

    expect(newState.multiplayer.game.status).toBe('showing-result')
    expect(newState.multiplayer.game.questionResult.correctAnswer).toBe('A')
    expect(newState.multiplayer.game.players).toEqual(resultPayload.players)
  })

  it('multiplayerGameOver should set players and finished status', () => {
    const state = { ...initialState }
    const gameOverPayload = {
      players: [
        { id: 'p2', score: 30, hasAnswered: true },
        { id: 'p1', score: 20, hasAnswered: true },
      ],
    }

    const newState = quizzSlice.reducer(
      state,
      appActions.multiplayerGameOver(gameOverPayload)
    )

    expect(newState.multiplayer.game.status).toBe('finished')
    expect(newState.multiplayer.game.players[0].score).toBe(30)
  })

  it('multiplayerRoomUpdated should update players and room userAmount', () => {
    const stateWithRoom = {
      ...initialState,
      multiplayer: {
        ...initialState.multiplayer,
        room: { name: 'room1', userAmount: 1 },
      },
    }

    const updatePayload = {
      players: [
        { id: 'p1', score: 0, hasAnswered: false },
        { id: 'p2', score: 0, hasAnswered: false },
      ],
      userAmount: 2,
    }

    const newState = quizzSlice.reducer(
      stateWithRoom,
      appActions.multiplayerRoomUpdated(updatePayload)
    )

    expect(newState.multiplayer.game.players).toHaveLength(2)
    expect(newState.multiplayer.room.userAmount).toBe(2)
  })

  it('multiplayerReset should reset all multiplayer game state', () => {
    const modifiedState = {
      ...initialState,
      multiplayer: {
        ...initialState.multiplayer,
        room: { name: 'room1', userAmount: 2 },
        game: {
          ...initialState.multiplayer.game,
          status: 'finished' as const,
          players: [{ id: 'p1', score: 20, hasAnswered: true }],
        },
      },
    }

    const newState = quizzSlice.reducer(modifiedState, appActions.multiplayerReset())

    expect(newState.multiplayer.game.status).toBe('idle')
    expect(newState.multiplayer.game.players).toEqual([])
    expect(newState.multiplayer.room).toBeNull()
  })

  it('multiplayerPlayerDisconnected should remove player from list', () => {
    const stateWithPlayers = {
      ...initialState,
      multiplayer: {
        ...initialState.multiplayer,
        game: {
          ...initialState.multiplayer.game,
          players: [
            { id: 'p1', score: 10, hasAnswered: true },
            { id: 'p2', score: 5, hasAnswered: false },
          ],
        },
      },
    }

    const newState = quizzSlice.reducer(
      stateWithPlayers,
      appActions.multiplayerPlayerDisconnected({ userId: 'p2' })
    )

    expect(newState.multiplayer.game.players).toHaveLength(1)
    expect(newState.multiplayer.game.players[0].id).toBe('p1')
  })
})
