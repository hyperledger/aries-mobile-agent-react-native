import React, { useState } from 'react'
import { StyleSheet, FlatList, Alert } from 'react-native'
import { useAgent, useConnectionById } from 'aries-hooks'

import { SafeAreaScrollView, Button, ModularView, Label, Success, Pending, Failure } from 'components'

import { parseSchema } from '../helpers'

interface Props {
  navigation: any
  route: any
}

const CredentialOffer: React.FC<Props> = ({ navigation, route }) => {
  const { agent } = useAgent()
  const [modalVisible, setModalVisible] = useState('')
  const [pendingMessage, setPendingMessage] = useState('')

  const { connectionId, credentialAttributes, id, metadata } = route?.params?.notification

  const connection = useConnectionById(connectionId)

  const handleAcceptPress = async () => {
    setModalVisible('pending')

    setTimeout(() => {
      setPendingMessage('This is taking Longer than expected. Check back later for your new credential.')
    }, 10000)

    try {
      await agent.credentials.acceptOffer(id)
    } catch {
      setModalVisible('failure')
    } finally {
      setModalVisible('success')
    }
  }

  const handleRejectPress = async () => {
    Alert.alert('Reject this Credential?', 'This decision cannot be changed.', [
      { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: async () => {
          setModalVisible('pending')
          try {
            // await agent.credentials.rejectOffer(credentialId)
          } catch {
            setModalVisible('failure')
          } finally {
            setModalVisible('success')
          }
        },
      },
    ])
  }

  return (
    <SafeAreaScrollView>
      <ModularView
        title={parseSchema(metadata.schemaId)}
        subtitle={connection.alias || connection.invitation?.label}
        content={
          <FlatList
            data={credentialAttributes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <Label title={item.name} subtitle={item.value} />}
          />
        }
      />
      <Button title="Accept" onPress={handleAcceptPress} />
      <Button title="Reject" negative onPress={handleRejectPress} />
      <Pending
        visible={modalVisible === 'pending'}
        banner="Accepting Credential"
        message={pendingMessage}
        onPress={
          pendingMessage
            ? () => {
                setModalVisible('')
                navigation.goBack()
              }
            : undefined
        }
      />
      <Success
        visible={modalVisible === 'success'}
        banner="Successfully Accepted Credential"
        onPress={() => {
          setModalVisible('')
          navigation.goBack()
        }}
      />
      <Failure visible={modalVisible === 'failure'} onPress={() => setModalVisible('')} />
    </SafeAreaScrollView>
  )
}

export default CredentialOffer

const styles = StyleSheet.create({})
