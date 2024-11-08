import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { useTheme } from '../contexts/theme'
import CredentialDetails from '../screens/CredentialDetails'
import ListCredentials from '../screens/ListCredentials'
import { CredentialStackParams, Screens } from '../types/navigators'

import { useDefaultStackOptions } from './defaultStackOptions'
import { TOKENS, useServices } from '../container-api'
import OpenIDCredentialDetails from '../modules/openid/screens/OpenIDCredentialOffer'

const CredentialStack: React.FC = () => {
  const Stack = createStackNavigator<CredentialStackParams>()
  const theme = useTheme()
  const { t } = useTranslation()
  const [
    CredentialListHeaderRight,
    CredentialListHeaderLeft,
    CredentialDetailsHeaderRight,
    CredOpenIdDetailHeaderRight
  ] =
    useServices([
      TOKENS.COMPONENT_CRED_LIST_HEADER_RIGHT,
      TOKENS.COMPONENT_CRED_LIST_HEADER_LEFT,
      TOKENS.COMPONENT_CRED_DETAILS_HEADER_RIGHT,
      TOKENS.COMPONENT_CRED_OPEN_ID_HEADER_RIGHT
    ])
  const defaultStackOptions = useDefaultStackOptions(theme)
  

  return (
    <Stack.Navigator screenOptions={{ ...defaultStackOptions }}>
      <Stack.Screen
        name={Screens.Credentials}
        component={ListCredentials}
        options={() => ({
          title: t('Screens.Credentials'),
          headerRight: () => <CredentialListHeaderRight />,
          headerLeft: () => <CredentialListHeaderLeft />,
        })}
      />
      <Stack.Screen
        name={Screens.CredentialDetails}
        component={CredentialDetails}
        options={{
          title: t('Screens.CredentialDetails'),
          headerRight: () => <CredentialDetailsHeaderRight />,
        }}
      />
      <Stack.Screen
        name={Screens.OpenIDCredentialDetails}
        component={OpenIDCredentialDetails}
        options={{
          title: t('Screens.CredentialDetails'),
          headerRight: () => <CredOpenIdDetailHeaderRight />,
        }}
      />
    </Stack.Navigator>
  )
}

export default CredentialStack
