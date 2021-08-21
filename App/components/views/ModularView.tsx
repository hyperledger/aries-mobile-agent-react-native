import React from 'react'
import { View, StyleSheet } from 'react-native'

import Title from '../texts/Title'
import Text from '../texts/Text'

import { shadow, borderRadius } from '../../globalStyles'

interface Props {
  title: string
  content: string | React.ReactNode
}

const ModularView: React.FC<Props> = ({ title, content }) => {
  return (
    <View style={styles.container}>
      <Title>{title}</Title>
      {typeof content === 'string' ? <Text style={styles.content}>{content}</Text> : content}
    </View>
  )
}

export default ModularView

const styles = StyleSheet.create({
  container: {
    borderRadius,
    backgroundColor: shadow,
    width: '90%',
    margin: 20,
    padding: 20,
  },
  content: {
    marginTop: 10,
  },
})
