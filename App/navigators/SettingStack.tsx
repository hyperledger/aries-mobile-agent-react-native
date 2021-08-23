import React from 'react'
import { createStackNavigator } from '@react-navigation/stack'

import Settings from '../screens/Settings'
import defaultStackOptions from './defaultStackOptions'

const Stack = createStackNavigator()

function SettingStack() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="Settings" component={Settings} />
    </Stack.Navigator>
  )
}

export default SettingStack
