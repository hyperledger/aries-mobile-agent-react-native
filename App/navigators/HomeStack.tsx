import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import Home from '../screens/Home'
import CredentialOffer from '../screens/CredentialOffer'

import defaultStackOptions from './defaultStackOptions'

const Stack = createStackNavigator()

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Credential Offer" component={CredentialOffer} />
    </Stack.Navigator>
  )
}

export default HomeStack
