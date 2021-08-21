import React from 'react'
import { Text, StyleSheet } from 'react-native'

import { textColor } from '../../globalStyles'

interface Props {
  children: React.ReactNode
}

const Title: React.FC<Props> = ({ children }) => {
  return <Text style={styles.title}>{children}</Text>
}

export default Title

const styles = StyleSheet.create({
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    color: textColor,
  },
})
