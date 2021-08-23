import React from 'react'
import { TouchableOpacity, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/core'
import { useConnectionById } from 'aries-hooks'

import Icon from 'react-native-vector-icons/MaterialIcons'

import Text from '../texts/Text'

import { textColor, backgroundColor, borderRadius } from '../../globalStyles'
import { parseSchema } from '../../helpers'

interface Props {
  notification: any
}

const NotificationProofListItem: React.FC<Props> = ({ notification }) => {
  const navigation = useNavigation()

  console.log('NOTIF', notification)

  const { connectionId } = notification

  const connection = useConnectionById(connectionId)

  return (
    <TouchableOpacity style={styles.container} onPress={() => navigation.navigate('Proof Request', { notification })}>
      <View>
        <Text style={styles.title}>Proof Request</Text>
        <Text>{connection.alias || connection.invitation?.label}</Text>
      </View>
      <Icon name="chevron-right" color={textColor} size={30} />
    </TouchableOpacity>
  )
}

export default NotificationProofListItem

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingVertical: 10,
    paddingLeft: 10,
    borderRadius,
    backgroundColor,
  },
  title: {
    fontWeight: 'bold',
  },
})
