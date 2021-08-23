import React, { useState } from 'react'
import { View } from 'react-native'
import { useAgent } from 'aries-hooks'

import { QRScanner, Pending, Success, Failure } from 'components'

interface Props {
  navigation: any
}

const Scan: React.FC<Props> = ({ navigation }) => {
  const { agent } = useAgent()

  const [modalVisible, setModalVisible] = useState<'pending' | 'success' | 'failure' | ''>('')

  const handleCodeScan = async (event: any) => {
    setModalVisible('pending')
    try {
      await agent.connections.receiveInvitationFromUrl(event.data, {
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
      <Pending visible={modalVisible === 'pending'} />
      <Success visible={modalVisible === 'success'} onPress={() => setModalVisible('')} />
      <Failure visible={modalVisible === 'failure'} onPress={() => setModalVisible('')} />
    </View>
  )
}
export default Scan
