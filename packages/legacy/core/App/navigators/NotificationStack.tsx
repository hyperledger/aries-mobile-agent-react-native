import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { TOKENS, useServices } from '../container-api'
import { useTheme } from '../contexts/theme'
import CredentialDetails from '../screens/CredentialDetails'
import CredentialOffer from '../screens/CredentialOffer'
import ProofRequest from '../screens/ProofRequest'
import { NotificationStackParams, Screens } from '../types/navigators'

import { useDefaultStackOptions } from './defaultStackOptions'

const NotificationStack: React.FC = () => {
  const Stack = createStackNavigator<NotificationStackParams>()
  const theme = useTheme()
  const { t } = useTranslation()
  const defaultStackOptions = useDefaultStackOptions(theme)
  const [{ customNotificationConfig: customNotification }, stackOptions] = useServices([TOKENS.NOTIFICATIONS, TOKENS.COMPONENT_STACK_OPTIONS])

  return (
    <Stack.Navigator screenOptions={{ ...defaultStackOptions }}>
      <Stack.Screen
        name={Screens.CredentialDetails}
        component={CredentialDetails}
        options={{
          title: t('Screens.CredentialDetails'),
          ...stackOptions.credentialDetailsStackOptions
        }}
      />
      <Stack.Screen
        name={Screens.CredentialOffer}
        component={CredentialOffer}
        options={{
          title: t('Screens.CredentialOffer'),
          ...stackOptions.credentialOfferStackOptions
        }}
      />
      <Stack.Screen
        name={Screens.ProofRequest}
        component={ProofRequest}
        options={{
          title: t('Screens.ProofRequest'),
        ...stackOptions.proofRequestStackOptions
        }}
      />
      {customNotification && (
        <Stack.Screen
          name={Screens.CustomNotification}
          component={customNotification.component}
          options={{
            title: t(customNotification.pageTitle as any),
          ...stackOptions.customNotifStackOptions
          }}
        />
      )}
      {customNotification &&
        customNotification.additionalStackItems?.length &&
        customNotification.additionalStackItems.map((item, i) => (
          <Stack.Screen key={i+1} name={item.name as any} component={item.component} options={item.stackOptions}></Stack.Screen>
        ))}
    </Stack.Navigator>
  )
}

export default NotificationStack
