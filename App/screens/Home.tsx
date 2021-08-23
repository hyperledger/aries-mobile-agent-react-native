import React from 'react'
import { FlatList } from 'react-native'
import { CredentialState, ProofState } from '@aries-framework/core'

import { useCredentialByState, useProofByState } from 'aries-hooks'

import {
  Button,
  SafeAreaScrollView,
  AppHeaderLarge,
  ModularView,
  NotificationCredentialListItem,
  NotificationProofListItem,
  Text,
} from 'components'

interface Props {
  navigation: any
}

const Home: React.FC<Props> = ({ navigation }) => {
  const credentials = useCredentialByState(CredentialState.OfferReceived)
  const proofs = useProofByState(ProofState.RequestReceived)
  console.log('PROOFS', proofs)

  return (
    <SafeAreaScrollView>
      <AppHeaderLarge />
      <Button title="Scanner" onPress={() => navigation.jumpTo('Scan')} />
      <ModularView
        title="Notifications"
        content={
          <FlatList
            data={[...credentials, ...proofs]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              item.type === 'CredentialRecord' ? (
                <NotificationCredentialListItem notification={item} />
              ) : (
                <NotificationProofListItem notification={item} />
              )
            }
            ListEmptyComponent={<Text>No New Updates</Text>}
          />
        }
      />
    </SafeAreaScrollView>
  )
}

export default Home
