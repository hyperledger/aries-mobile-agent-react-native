import { Agent } from '@aries-framework/core'
import { useNavigation } from '@react-navigation/core'
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppState, View } from 'react-native'

import { useAuth } from '../contexts/auth'
import { useConfiguration } from '../contexts/configuration'
import { DispatchAction } from '../contexts/reducers/store'
import { useStore } from '../contexts/store'
import { useTheme } from '../contexts/theme'
import Onboarding from '../screens/Onboarding'
import { createCarouselStyle } from '../screens/OnboardingPages'
import PinCreate from '../screens/PinCreate'
import PinEnter from '../screens/PinEnter'
import Splash from '../screens/Splash'
import { AuthenticateStackParams, Screens, Stacks } from '../types/navigators'

import ConnectStack from './ConnectStack'
import ContactStack from './ContactStack'
import DeliveryStack from './DeliveryStack'
import NotificationStack from './NotificationStack'
import SettingStack from './SettingStack'
import TabStack from './TabStack'
import { createDefaultStackOptions } from './defaultStackOptions'

interface RootStackProps {
  setAgent: React.Dispatch<React.SetStateAction<Agent | undefined>>
  agent: Agent | undefined
}

const RootStack: React.FC<RootStackProps> = (props: RootStackProps) => {
  const { setAgent, agent } = props
  const [state, dispatch] = useStore()
  const { wipeSavedWalletSecret } = useAuth()
  const appState = useRef(AppState.currentState)
  const [backgroundTime, setBackgroundTime] = useState<number | undefined>(undefined)
  const [prevAppStateVisible, setPrevAppStateVisible] = useState<string>('')
  const [appStateVisible, setAppStateVisible] = useState<string>('')
  const { t } = useTranslation()
  const navigation = useNavigation<StackNavigationProp<AuthenticateStackParams>>()
  const theme = useTheme()
  const defaultStackOptions = createDefaultStackOptions(theme)
  const OnboardingTheme = theme.OnboardingTheme
  const { pages, terms, splash, useBiometry } = useConfiguration()

  const lockoutUser = async () => {
    if (agent && state.authentication.didAuthenticate) {
      // make shure agent is shutdown so wallet isn't still open
      await agent.shutdown()
      wipeSavedWalletSecret()
      dispatch({
        type: DispatchAction.DID_AUTHENTICATE,
        payload: [{ didAuthenticate: false }],
      })
    }
  }

  useEffect(() => {
    AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        //update time that app gets put in background
        setBackgroundTime(Date.now())
      }

      setPrevAppStateVisible(appState.current)
      appState.current = nextAppState
      setAppStateVisible(appState.current)
    })
  }, [])

  useEffect(() => {
    if (appStateVisible.match(/active/) && prevAppStateVisible.match(/inactive|background/) && backgroundTime) {
      // prevents the user from being locked out during metro reloading
      setPrevAppStateVisible(appStateVisible)
      //lock user out after 5 minutes
      const MS_PER_MINUTE = 60000
      if (backgroundTime && Date.now() - backgroundTime > 5 * MS_PER_MINUTE) {
        dispatch({
          type: DispatchAction.LOCKOUT_UPDATED,
          payload: [{ displayNotification: true }],
        })
        lockoutUser()
      }
    }
  }, [appStateVisible, prevAppStateVisible, backgroundTime])

  const onTutorialCompleted = () => {
    dispatch({
      type: DispatchAction.DID_COMPLETE_TUTORIAL,
    })
    navigation.navigate(Screens.Terms)
  }

  const onAuthenticated = () => {
    dispatch({
      type: DispatchAction.DID_AUTHENTICATE,
    })
  }

  const authStack = () => {
    const Stack = createStackNavigator()

    return (
      <Stack.Navigator initialRouteName={Screens.Splash} screenOptions={{ ...defaultStackOptions, headerShown: false }}>
        <Stack.Screen name={Screens.Splash}>
          {(props) => <Splash {...props} agent={agent} setAgent={setAgent} />}
        </Stack.Screen>
        <Stack.Screen name={Screens.EnterPin}>
          {(props) => <PinEnter {...props} setAuthenticated={() => onAuthenticated()} />}
        </Stack.Screen>
      </Stack.Navigator>
    )
  }

  const mainStack = () => {
    const Stack = createStackNavigator()

    return (
      <Stack.Navigator initialRouteName={Screens.Splash} screenOptions={{ ...defaultStackOptions, headerShown: false }}>
        <Stack.Screen name={Screens.Splash}>
          {(props) => <Splash {...props} agent={agent} setAgent={setAgent} />}
        </Stack.Screen>
        <Stack.Screen name={Stacks.TabStack} component={TabStack} />
        <Stack.Screen name={Stacks.ConnectStack} component={ConnectStack} options={{ presentation: 'modal' }} />
        <Stack.Screen name={Stacks.SettingStack} component={SettingStack} />
        <Stack.Screen name={Stacks.ContactStack} component={ContactStack} />
        <Stack.Screen name={Stacks.NotificationStack} component={NotificationStack} />
        <Stack.Screen name={Stacks.ConnectionStack} component={DeliveryStack} />
      </Stack.Navigator>
    )
  }

  const onboardingStack = () => {
    const Stack = createStackNavigator()
    const carousel = createCarouselStyle(OnboardingTheme)
    return (
      <Stack.Navigator initialRouteName={Screens.Splash} screenOptions={{ ...defaultStackOptions, headerShown: false }}>
        <Stack.Screen name={Screens.Splash}>
          {(props) => <Splash {...props} agent={agent} setAgent={setAgent} />}
        </Stack.Screen>
        <Stack.Screen
          name={Screens.Onboarding}
          options={() => ({
            title: t('Screens.Onboarding'),
            headerTintColor: OnboardingTheme.headerTintColor,
            headerShown: true,
            gestureEnabled: false,
            headerLeft: () => false,
          })}
        >
          {(props) => (
            <Onboarding
              {...props}
              nextButtonText={t('Global.Next')}
              previousButtonText={t('Global.Back')}
              pages={pages(onTutorialCompleted, OnboardingTheme)}
              style={carousel}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name={Screens.Terms}
          options={() => ({
            title: t('Screens.Terms'),
            headerTintColor: OnboardingTheme.headerTintColor,
            headerShown: true,
            headerLeft: () => false,
            rightLeft: () => false,
          })}
          component={terms}
        />
        <Stack.Screen name={Screens.CreatePin}>
          {(props) => <PinCreate {...props} setAuthenticated={() => onAuthenticated()} />}
        </Stack.Screen>
        <Stack.Screen
          name={Screens.UseBiometry}
          options={() => ({
            title: t('Screens.Biometry'),
            headerTintColor: OnboardingTheme.headerTintColor,
            headerShown: true,
            headerLeft: () => false,
            rightLeft: () => false,
          })}
          component={useBiometry}
        />
      </Stack.Navigator>
    )
  }

  if (
    state.onboarding.didAgreeToTerms &&
    state.onboarding.didCompleteTutorial &&
    state.onboarding.didCreatePIN &&
    state.onboarding.didConsiderBiometry
  ) {
    return state.authentication.didAuthenticate ? mainStack() : authStack()
  }

  return onboardingStack()
}

export default RootStack
