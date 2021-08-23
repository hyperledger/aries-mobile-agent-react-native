import React from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'

import Text from '../texts/Text'

import { mainColor, borderRadius, shadow, textColor } from '../../globalStyles'

interface Props {
  title: string
  onPress?: () => void
  disabled?: boolean
  neutral?: true
  negative?: true
}

const Button: React.FC<Props> = ({ title, onPress, disabled, neutral, negative }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, disabled && styles.disabled, neutral && styles.neutral, negative && styles.negative]}
      disabled={disabled}
    >
      <Text style={[styles.text, neutral && { color: shadow }]}>{title}</Text>
    </TouchableOpacity>
  )
}

export default Button

const styles = StyleSheet.create({
  button: {
    width: '90%',
    borderRadius,
    backgroundColor: mainColor,
    alignItems: 'center',
    padding: 10,
    marginVertical: 10,
  },
  disabled: {
    backgroundColor: shadow,
  },
  neutral: {
    backgroundColor: textColor,
  },
  negative: {
    backgroundColor: '#de3333',
  },
  text: {
    fontSize: 16,
  },
})
