import React from 'react'
import { StyleSheet, FlatList } from 'react-native'
import { useAgent } from 'aries-hooks'

import { SafeAreaScrollView, Button, ModularView, Label } from 'components'

interface Props {
  navigation: any
  route: any
}

const CredentialOffer: React.FC<Props> = ({ navigation, route }) => {
  const { agent } = useAgent()

  const notification = route?.params?.notification

  const handleAcceptPress = async () => {
    await agent.credentials.acceptOffer(notification.id)
    navigation.goBack()
  }

  const handleRejectPress = async () => {
    navigation.goBack()
  }

  return (
    <SafeAreaScrollView>
      <ModularView
        title="Offered Information"
        content={
          <FlatList
            data={notification.credentialAttributes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <Label title={item.name} subtitle={item.value} />}
          />
        }
      />
      <Button title="Accept" onPress={handleAcceptPress} />
      <Button title="Reject" negative onPress={handleRejectPress} />
    </SafeAreaScrollView>
  )
}

export default CredentialOffer

const styles = StyleSheet.create({})
