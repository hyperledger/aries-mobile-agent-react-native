import React, { useState, useEffect } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import * as Keychain from 'react-native-keychain'
import AsyncStorage from '@react-native-community/async-storage'

import PinCreate from '../screens/PinCreate'
import PinEnter from '../screens/PinEnter'
import Terms from '../screens/Terms'

import defaultStackOptions from './defaultStackOptions'

const Stack = createStackNavigator()

interface Props {
  setAuthenticated: any
}

const AuthenticateStack: React.FC<Props> = ({ setAuthenticated }) => {
  const [firstLogin, setFirstLogin] = useState(true)

  const checkFirstLogin = async () => {
    try {
      const firstLaunch = await AsyncStorage.getItem('firstLaunch')
      if (firstLaunch == null) {
        await AsyncStorage.setItem('firstLaunch', 'false')
        await Keychain.resetGenericPassword({ service: 'passcode' })
      } else {
        setFirstLogin(false)
      }
    } catch (e) {
      //error
    }
  }

  useEffect(() => {
    checkFirstLogin()
  }, [])

  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      {firstLogin && (
        <>
          <Stack.Screen name="Terms & Conditions" component={Terms} />
          <Stack.Screen name="Create 6-Digit Pin" component={PinCreate} initialParams={{ setAuthenticated }} />
        </>
      )}
      <Stack.Screen name="Enter Pin" component={PinEnter} initialParams={{ setAuthenticated }} />
    </Stack.Navigator>
  )
}

export default AuthenticateStack
