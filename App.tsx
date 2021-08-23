import React, { useState } from 'react'
import { View } from 'react-native'
import Config from 'react-native-config'

import { ConsoleLogger, LogLevel, MediatorPickupStrategy } from '@aries-framework/core'
import indy from 'indy-sdk-react-native'

import AgentProvider from 'aries-hooks'

import TabNavigator from './App/navigators/TabNavigator'
import AuthenticateStack from './App/navigators/AuthenticateStack'

global.Buffer = global.Buffer || require('buffer').Buffer

const agentConfig = {
  label: 'Aries Bifold',
  mediatorConnectionsInvite: Config.MEDIATOR_URL,
  autoAcceptMediationRequests: true,
  mediatorPickupStrategy: MediatorPickupStrategy.Implicit,
  walletConfig: { id: 'wallet4', key: '123' },
  autoAcceptConnections: true,
  poolName: 'test-183',
  logger: new ConsoleLogger(LogLevel.trace),
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
