import { StyleSheet, Pressable } from 'react-native'
import React from 'react'
import Themes from '../../constants/Themes'
import AppText from '../themes/Text'

interface JokerItemProps {
  label: string
  icon: React.JSX.Element
  onPress: () => void
  variant?: 'primary' | 'secondary'
}

const JokerItem = ({ label, icon, onPress, variant = 'primary' }: JokerItemProps) => {
  const isPrimary = variant === 'primary'

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
        pressed && styles.buttonPressed,
      ]}
    >
      {icon}
      <AppText
        color={isPrimary ? Themes.colors.primary : Themes.colors.secondary}
        size={11}
      >
        {label}
      </AppText>
    </Pressable>
  )
}

export default JokerItem

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  buttonPrimary: {
    backgroundColor: Themes.colors.primary + '10',
    borderColor: Themes.colors.primary + '30',
  },
  buttonSecondary: {
    backgroundColor: Themes.colors.secondary + '15',
    borderColor: Themes.colors.secondary + '35',
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
})
