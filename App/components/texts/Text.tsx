import React from 'react'
import { Text as T, StyleSheet } from 'react-native'

import { textColor } from '../../globalStyles'

interface Props {
  children: React.ReactNode
  style?: any
}

const Text: React.FC<Props> = ({ children, style }) => {
  return <T style={[styles.text, style]}>{children}</T>
}

export default Text

const styles = StyleSheet.create({
  text: {
    color: textColor,
  },
})
