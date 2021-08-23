import React from 'react'
import { FlatList } from 'react-native'

import { useConnections } from 'aries-hooks'

import { ContactListItem, Text } from 'components'
import { backgroundColor } from '../globalStyles'

interface Props {
  navigation: any
}

const ListContacts: React.FC<Props> = ({ navigation }) => {
  const { connections } = useConnections()

  return (
    <FlatList
      data={connections}
      renderItem={({ item }) => <ContactListItem contact={item} />}
      keyExtractor={(item: any) => item.did}
      style={{ backgroundColor }}
      ListEmptyComponent={() => <Text style={{ textAlign: 'center', margin: 100 }}>None yet!</Text>}
    />
  )
}

export default ListContacts
