import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import ListContacts from '../screens/ListContacts'
import defaultStackOptions from './defaultStackOptions'
import ContactDetails from '../screens/ContactDetails'

const Stack = createStackNavigator()

function ContactStack() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="Contacts" component={ListContacts} />
      <Stack.Screen name="ContactDetails" component={ContactDetails} />
    </Stack.Navigator>
  )
}

export default ContactStack
