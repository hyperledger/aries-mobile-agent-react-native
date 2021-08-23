import React from 'react'
import { View, StyleSheet, Modal } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'

import Button from '../buttons/Button'
import Title from '../texts/Title'
import Text from '../texts/Text'

import { textColor } from '../../globalStyles'

interface Props {
  icon: string
  banner: string
  message?: string
  backgroundColor: string
  visible: boolean
  onPress?: () => void
}

const Message: React.FC<Props> = ({ icon, banner, message, backgroundColor, visible, onPress }) => {
  return (
    <Modal visible={visible} animationType="fade">
      <View style={[styles.container, { backgroundColor }]}>
        <View style={{ alignItems: 'center' }}>
          <Icon name={icon} color={'white'} size={160} />
          <Title>{banner}</Title>
          <Text>{message}</Text>
        </View>
        {onPress && <Button title="Close" neutral onPress={onPress} />}
      </View>
    </Modal>
  )
}

export default Message

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
})
