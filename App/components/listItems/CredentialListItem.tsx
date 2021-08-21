import React from 'react'
import { View, StyleSheet } from 'react-native'

import Title from '../texts/Title'
import Text from '../texts/Text'

import { shadow, borderRadius } from '../../globalStyles'

interface Props {
  credential: any
}

const CredentialListItem: React.FC<Props> = ({ credential }) => {
  return (
    <View style={styles.container}>
      <Title>{credential.schemaId.split(':')[2]}</Title>
      <Text>{credential.id}</Text>
    </View>
  )
}

export default CredentialListItem

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    marginHorizontal: 15,
    padding: 10,
    borderRadius,
    backgroundColor: shadow,
  },
})
