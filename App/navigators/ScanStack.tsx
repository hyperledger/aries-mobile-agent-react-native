import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import defaultStackOptions from './defaultStackOptions'
import Scan from '../screens/Scan'

const Stack = createStackNavigator()

function ScanStack() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="Scan" component={Scan} />
    </Stack.Navigator>
  )
}

export default ScanStack
