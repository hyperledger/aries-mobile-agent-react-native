import React from 'react'
import { FlatList } from 'react-native'
import { CredentialState } from 'aries-framework'

import { useCredentialByState } from 'aries-hooks'

import { Button, SafeAreaScrollView, AppHeaderLarge, ModularView, NotificationListItem, Text } from 'components'

interface Props {
  navigation: any
}

const Home: React.FC<Props> = ({ navigation }) => {
  const credentials = useCredentialByState(CredentialState.OfferReceived)

  return (
    <SafeAreaScrollView>
      <AppHeaderLarge />
      <Button title="Scanner" onPress={() => navigation.jumpTo('Scan')} />
      <ModularView
        title="Notifications"
        content={
          <FlatList
            data={credentials}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <NotificationListItem notification={item} />}
            ListEmptyComponent={<Text>No New Updates</Text>}
          />
        }
      />
    </SafeAreaScrollView>
  )
}

export default Home
