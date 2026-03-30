import { StyleSheet, Pressable } from 'react-native'
import React from 'react'
import Themes from '../../constants/Themes'
import AppText from '../themes/Text'

interface JokerItemProps {
  label: string
  icon: React.JSX.Element
  onPress: () => void
}

const JokerItem = ({ label, icon, onPress }: JokerItemProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
    >
      {icon}
      <AppText color="white" size={12}>
        {label}
      </AppText>
    </Pressable>
  )
}

export default JokerItem

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    padding: 5,
    borderRadius: 14,
    backgroundColor: Themes.colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
})
