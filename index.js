/**
 * @format
 */
import '@azure/core-asynciterator-polyfill'
import 'react-native-gesture-handler'
import { AppRegistry } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import App from './App'
import { name as appName } from './app.json'

const Base = (props) => (
  <NavigationContainer>
    <App />
  </NavigationContainer>
)

AppRegistry.registerComponent(appName, () => Base)
