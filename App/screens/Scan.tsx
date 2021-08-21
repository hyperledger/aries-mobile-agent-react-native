import React, { useState } from 'react'
import { View } from 'react-native'
import { useAgent } from 'aries-hooks'

import { decodeInvitationFromUrl } from 'aries-framework'

import { Message, QRScanner } from 'components'

import { backgroundColor, mainColor } from '../globalStyles'

interface Props {
  navigation: any
}

const Scan: React.FC<Props> = ({ navigation }) => {
  const { agent } = useAgent()

  const [modalVisible, setModalVisible] = useState<'inProgress' | 'success' | 'failure' | ''>('')

  const handleCodeScan = async (event: any) => {
    setModalVisible('inProgress')
    try {
      const decodedInvitation = await decodeInvitationFromUrl(event.data)
      await agent.connections.receiveInvitation(decodedInvitation, {
        autoAcceptConnection: true,
      })
    } catch {
      setModalVisible('failure')
    } finally {
      setModalVisible('success')
    }
  }

  return (
    <View>
      <QRScanner handleCodeScan={handleCodeScan} />
      <Message
        visible={modalVisible === 'inProgress'}
        message="Pending Connection"
        icon="alarm"
        backgroundColor={backgroundColor}
      />
      <Message
        visible={modalVisible === 'success'}
        message="Connection Complete"
        icon="check-circle"
        backgroundColor={mainColor}
        continueButton
        onPress={() => setModalVisible('')}
      />
      <Message
        visible={modalVisible === 'failure'}
        message="Connection Failed. Please try again."
        icon="cancel"
        backgroundColor="#de3333"
        continueButton
        onPress={() => setModalVisible('')}
      />
    </View>
  )
}
export default Scan
