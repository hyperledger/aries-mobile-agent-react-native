import React from 'react'
import { View, StyleSheet } from 'react-native'
import { DateTime } from 'luxon'

import Text from '../texts/Text'
import Title from '../texts/Title'

import { shadow, borderRadius } from '../../globalStyles'

interface Props {
  contact: any
}

const ContactListItem: React.FC<Props> = ({ contact }) => {
  return (
    <View key={contact.contact_id} style={styles.container}>
      <Title>{contact.alias || contact.invitation.label}</Title>
      <Text>{contact.did}</Text>
      <Text style={styles.date}>{DateTime.fromJSDate(contact.createdAt).toFormat('LLL d, yyyy')}</Text>
    </View>
  )
}

export default ContactListItem

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    marginHorizontal: 15,
    padding: 10,
    borderRadius,
    backgroundColor: shadow,
  },
  date: {
    textAlign: 'right',
  },
})
