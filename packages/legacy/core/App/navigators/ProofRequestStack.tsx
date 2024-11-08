import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'

import IconButton, { ButtonLocation } from '../components/buttons/IconButton'
import { useTheme } from '../contexts/theme'
import ListProofRequests from '../screens/ListProofRequests'
import MobileVerifierLoading from '../screens/MobileVerifierLoading'
import ProofChangeCredential from '../screens/ProofChangeCredential'
import ProofDetails from '../screens/ProofDetails'
import ProofRequestDetails from '../screens/ProofRequestDetails'
import ProofRequestUsageHistory from '../screens/ProofRequestUsageHistory'
import ProofRequesting from '../screens/ProofRequesting'
import { ProofRequestsStackParams, Screens } from '../types/navigators'
import { testIdWithKey } from '../utils/testable'

import { useDefaultStackOptions } from './defaultStackOptions'
import { TOKENS, useServices } from '../container-api'

const ProofRequestStack: React.FC = () => {
  const Stack = createStackNavigator<ProofRequestsStackParams>()
  const theme = useTheme()
  const { t } = useTranslation()
  const defaultStackOptions = useDefaultStackOptions(theme)
  const [
    ProofHeaderRight,
    ProofReqDetailsHeaderRight,
    ProofChangeCredHeaderRight,
    ProofRequestingHeaderRight,
    ProofDetailsHeaderRight,
    ProofUsageHistoryHeaderRight
  ] = useServices([
    TOKENS.COMPONENT_PROOF_HEADER_RIGHT,
    TOKENS.COMPONENT_PROOF_REQ_DETAILS_HEADER_RIGHT,
    TOKENS.COMPONENT_PROOF_CHANGE_CRED_HEADER_RIGHT,
    TOKENS.COMPONENT_PROOF_REQUESTING_HEADER_RIGHT,
    TOKENS.COMPONENT_PROOF_DETAILS_HEADER_RIGHT,
    TOKENS.COMPONENT_PROOF_USAGE_HISTORY_HEADER_RIGHT,
  ])

  return (
    <Stack.Navigator screenOptions={{ ...defaultStackOptions }}>
      <Stack.Screen
        name={Screens.ProofRequests}
        component={ListProofRequests}
        options={{
          title: t('Screens.ChooseProofRequest'),
          headerRight: () => <ProofHeaderRight />,
        }}
      />
      <Stack.Screen
        name={Screens.ProofRequestDetails}
        component={ProofRequestDetails}
        options={() => ({
          title: '',
          headerRight: () => <ProofReqDetailsHeaderRight />,
        })}
      />
      <Stack.Screen
        name={Screens.MobileVerifierLoading}
        component={MobileVerifierLoading}
        options={{ ...defaultStackOptions }}
      />
      <Stack.Screen
        name={Screens.ProofChangeCredential}
        component={ProofChangeCredential}
        options={{
          title: t('Screens.ProofChangeCredential'),
          headerRight: () => <ProofChangeCredHeaderRight />,
         }}
      ></Stack.Screen>
      <Stack.Screen
        name={Screens.ProofRequesting}
        component={ProofRequesting}
        options={({ navigation }) => ({
          title: t('ProofRequest.RequestForProof'),
          headerLeft: () => (
            <IconButton
              buttonLocation={ButtonLocation.Left}
              accessibilityLabel={t('Global.Back')}
              testID={testIdWithKey('BackButton')}
              onPress={() => navigation.navigate(Screens.ProofRequests, {})}
              icon="arrow-left"
            />
          ),
          headerRight: () => <ProofRequestingHeaderRight />,
        })}
      />
      <Stack.Screen
        name={Screens.ProofDetails}
        component={ProofDetails}
        options={({ navigation, route }) => ({
          title: '',
          headerLeft: () => (
            <IconButton
              buttonLocation={ButtonLocation.Left}
              accessibilityLabel={t('Global.Back')}
              testID={testIdWithKey('BackButton')}
              onPress={() => {
                if (route.params.isHistory) {
                  navigation.goBack()
                } else {
                  navigation.navigate(Screens.ProofRequests, {})
                }
              }}
              icon="arrow-left"
            />
          ),
          headerRight: () => <ProofDetailsHeaderRight />,
        })}
      />
      <Stack.Screen
        name={Screens.ProofRequestUsageHistory}
        component={ProofRequestUsageHistory}
        options={() => ({
          title: t('Screens.ProofRequestUsageHistory'),
          headerRight: () => <ProofUsageHistoryHeaderRight />,
        })}
      />
    </Stack.Navigator>
  )
}

export default ProofRequestStack
