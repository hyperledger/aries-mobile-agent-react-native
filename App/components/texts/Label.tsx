import React from 'react'
import { View, StyleSheet } from 'react-native'

import Text from './Text'

interface Props {
  title: string
  subtitle: string
  label?: string
}

const Label: React.FC<Props> = ({ title, subtitle, label }) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}:</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

export default Label

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    marginTop: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 7,
  },
  subtitle: {},
  label: {
    marginLeft: 10,
    fontSize: 10,
    fontStyle: 'italic',
  },
})
