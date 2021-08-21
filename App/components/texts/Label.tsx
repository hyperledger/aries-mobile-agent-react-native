import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { textColor } from '../../globalStyles'

interface Props {
  title: string
  subtitle: string
}

const Label: React.FC<Props> = ({ title, subtitle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}:</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  )
}

export default Label

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginTop: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: textColor,
    marginRight: 10,
  },
  subtitle: {
    color: textColor,
  },
})
