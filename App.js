import React, { useState } from 'react'
import { View } from 'react-native'
import Config from 'react-native-config'

import { ConsoleLogger, LogLevel } from 'aries-framework'
import indy from 'rn-indy-sdk'

import AgentProvider from 'aries-hooks'

//For UUIDv4 within React Native
import 'react-native-get-random-values'

import TabNavigator from './App/navigators/TabNavigator'
import AuthenticateStack from './App/navigators/AuthenticateStack'

const agentConfig = {
  label: 'Aries Bifold',
  mediatorUrl: Config.MEDIATOR_URL,
  walletConfig: { id: 'wallet4' },
  walletCredentials: { key: '123' },
  autoAcceptConnections: true,
  poolName: 'test-183',
  logger: new ConsoleLogger(LogLevel.debug),
  indy,
}

const App = () => {
  const [authenticated, setAuthenticated] = useState(false)

  return (
    <AgentProvider agentConfig={agentConfig} genesisUrl={Config.GENESIS_URL}>
      <View style={{ height: '100%' }}>
        {authenticated ? <TabNavigator /> : <AuthenticateStack setAuthenticated={setAuthenticated} />}
      </View>
    </AgentProvider>
  )
}

export default App
