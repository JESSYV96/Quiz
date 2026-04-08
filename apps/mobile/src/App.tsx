import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { Provider } from 'react-redux'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import Themes from './constants/Themes'
import Home from './screens/Home'
import SettingsScreen from './screens/settings/Settings'
import { useFonts } from 'expo-font'
import QuizzScreen from './screens/quizz/Game'
import { store } from './configs/store'
import ScoreboardScreen from './screens/quizz/Scoreboard'
import MultiplayerSettingsScreen from './screens/multiplayer/Settings'
import MultiplayerHomeScreen from './screens/multiplayer/Home'
import RoomListScreen from './screens/multiplayer/RoomList'
import MultiplayerGameScreen from './screens/multiplayer/MultiplayerGame'
import MultiplayerScoreboardScreen from './screens/multiplayer/MultiplayerScoreboard'
import './i18n'

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Themes.colors.background
  }
}



export default function App() {
  const Stack = createNativeStackNavigator()



  const [loaded, error] = useFonts({
    'Lemon-Milk': require('../assets/fonts/lemon_milk/lemon_milk.otf')
  })
  return (
    loaded && (
      <Provider store={store}>
        <NavigationContainer theme={MyTheme}>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
            <Stack.Screen
              name="Quizz"
              component={QuizzScreen}
              options={{
                headerShown: false
              }}
            />
            <Stack.Screen
              name="Scoreboard"
              component={ScoreboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="MultiplayerSettings" component={MultiplayerSettingsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MultiplayerHome" component={MultiplayerHomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MultiplayerRooms" component={RoomListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MultiplayerGame" component={MultiplayerGameScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MultiplayerScoreboard" component={MultiplayerScoreboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar />
      </Provider>
    )
  )
}
