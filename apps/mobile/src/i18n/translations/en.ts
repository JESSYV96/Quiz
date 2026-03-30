import type { Translations } from './index'

const en: Translations = {
  home: {
    subtitle: 'Learn while\nhaving fun',
    playSolo: 'Play solo',
    multiplayer: 'Multiplayer',
  },
  settings: {
    title: 'Settings',
    difficulty: 'Difficulty',
    effect: 'Effect',
    language: 'Language',
  },
  game: {
    question: (current: number, total: number) => `Question ${current}/${total}`,
    score: (score: number) => `Score: ${score}`,
    validate: 'Submit',
    next: 'Next',
    skip: 'Skip',
    loading: 'Loading...',
  },
  scoreboard: {
    yourScore: 'Your score',
    perfect: 'Perfect!',
    wellPlayed: 'Well played!',
    notBad: 'Not bad!',
    tryAgain: "You'll do better next time!",
    backToHome: 'Back to home',
    playAgain: 'Play again',
  },
  multiplayer: {
    title: 'Multiplayer',
    subtitle: 'Play with your friends in real time',
    createGame: 'Create a game',
    joinGame: 'Join a game',
    availableRooms: 'Available rooms',
    noRooms: 'No rooms available',
    noRoomsHint: 'Create a game or refresh',
    room: 'Room',
    connected: (count: number) => `${count} player(s) connected`,
    players: 'Players',
    player: (index: number) => `Player ${index}`,
    me: '(me)',
    admin: 'Admin',
    waitingPlayers: 'Waiting for players...',
    startGame: 'Start game',
    leave: 'Leave',
    waitingOthers: (answered: number, total: number) =>
      `Waiting for other players... (${answered}/${total})`,
    correctAnswer: 'Correct answer',
    results: 'Results',
    backToHome: 'Back to home',
    full: 'Full',
    join: 'Join',
    playerCount: (current: number, max: number) => `${current}/${max} player(s)`,
    pts: 'pts',
  },
  enums: {
    difficulty: {
      None: 'None',
      Easy: 'Easy',
      Medium: 'Medium',
      Hard: 'Hard',
    },
    effect: {
      None: 'None',
      Vibration: 'Vibration',
    },
    language: {
      French: 'French',
      English: 'English',
    },
  },
}

export default en
