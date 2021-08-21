import React from 'react'
import { View, Text, StyleSheet, Modal } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'

import Button from '../buttons/Button'

import { textColor } from '../../globalStyles'

interface Props {
  icon: string
  message: string
  backgroundColor: string
  visible: boolean
  continueButton?: true
  onPress?: () => void
}

const Message: React.FC<Props> = ({ icon, message, backgroundColor, visible, continueButton, onPress }) => {
  return (
    <Modal visible={visible} animationType="fade">
      <View style={[styles.container, { backgroundColor }]}>
        <View style={{ alignItems: 'center' }}>
          <Icon name={icon} color={'white'} size={160} />
          <Text style={styles.message}>{message}</Text>
        </View>
        {continueButton && <Button title="Continue" neutral onPress={onPress} />}
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
  message: {
    textAlign: 'center',
    color: textColor,
    fontSize: 25,
  },
})
