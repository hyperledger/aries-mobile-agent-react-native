import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import ListCredentials from '../screens/ListCredentials'
import defaultStackOptions from './defaultStackOptions'
import CredentialDetails from '../screens/CredentialDetails'

const Stack = createStackNavigator()

function CredentialStack() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="Credentials" component={ListCredentials} />
      <Stack.Screen name="CredentialDetails" component={CredentialDetails} />
    </Stack.Navigator>
  )
}

export default CredentialStack
