import { DidExchangeState } from '@credo-ts/core'
import { useConnectionById } from '@credo-ts/react-hooks'
import { CommonActions, useFocusEffect } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AccessibilityInfo, BackHandler, Modal, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Button, { ButtonType } from '../components/buttons/Button'
import { useAnimatedComponents } from '../contexts/animated-components'
import { useConfiguration } from '../contexts/configuration'
import { useTheme } from '../contexts/theme'
import { useOutOfBandByConnectionId } from '../hooks/connections'
import { useNotifications } from '../hooks/notifications'
import { DeliveryStackParams, Screens, Stacks, TabStacks } from '../types/navigators'
import { testIdWithKey } from '../utils/testable'

import { useContainer, TOKENS } from './../container-api'

type ConnectionProps = StackScreenProps<DeliveryStackParams, Screens.Connection>

type MergeFunction = (current: LocalState, next: Partial<LocalState>) => LocalState

type LocalState = {
  isVisible: boolean
  isInitialized: boolean
  notificationRecord?: any
  shouldShowDelayMessage: boolean
}

const GoalCodes = {
  proofRequestVerify: 'aries.vc.verify',
  proofRequestVerifyOnce: 'aries.vc.verify.once',
  credentialOffer: 'aries.vc.issue',
} as const

const Connection: React.FC<ConnectionProps> = ({ navigation, route }) => {
  const { connectionId, threadId } = route.params
  const { connectionTimerDelay, autoRedirectConnectionToHome } = useConfiguration()
  const connTimerDelay = connectionTimerDelay ?? 10000 // in ms
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { t } = useTranslation()
  const { notifications } = useNotifications()
  const { ColorPallet, TextTheme } = useTheme()
  const { ConnectionLoading } = useAnimatedComponents()
  const container = useContainer()
  const logger = container.resolve(TOKENS.UTIL_LOGGER)
  const connection = useConnectionById(connectionId ?? '')
  const oobRecord = useOutOfBandByConnectionId(connectionId ?? '')
  const merge: MergeFunction = (current, next) => ({ ...current, ...next })
  const [state, dispatch] = useReducer(merge, {
    isVisible: true,
    isInitialized: false,
    shouldShowDelayMessage: false,
    notificationRecord: undefined,
  })
  const styles = StyleSheet.create({
    container: {
      height: '100%',
      backgroundColor: ColorPallet.brand.modalPrimaryBackground,
      padding: 20,
    },
    image: {
      marginTop: 20,
    },
    messageContainer: {
      alignItems: 'center',
    },
    messageText: {
      fontWeight: TextTheme.normal.fontWeight,
      textAlign: 'center',
      marginTop: 30,
    },
    controlsContainer: {
      marginTop: 'auto',
      margin: 20,
    },
    delayMessageText: {
      textAlign: 'center',
      marginTop: 20,
    },
  })

  const startTimer = () => {
    if (!state.isInitialized) {
      timerRef.current = setTimeout(() => {
        dispatch({ shouldShowDelayMessage: true })
        timerRef.current = null
      }, connTimerDelay)

      dispatch({ isInitialized: true })
    }
  }

  const abortTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const onDismissModalTouched = () => {
    dispatch({ shouldShowDelayMessage: false, isVisible: false })
    navigation.getParent()?.navigate(TabStacks.HomeStack, { screen: Screens.Home })
  }

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true)
    return () => backHandler.remove()
  }, [])

  useEffect(() => {
    if (state.shouldShowDelayMessage && !state.notificationRecord) {
      if (autoRedirectConnectionToHome) {
        dispatch({ shouldShowDelayMessage: false, isVisible: false })
        navigation.getParent()?.navigate(TabStacks.HomeStack, { screen: Screens.Home })
      } else {
        AccessibilityInfo.announceForAccessibility(t('Connection.TakingTooLong'))
      }
    }
  }, [state.shouldShowDelayMessage])

  useEffect(() => {
    if (!state.notificationRecord || !state.isVisible) {
      return
    }

    // connectionless proof request, we don't have connectionless offers.
    if (!connection) {
      dispatch({ isVisible: false })
      navigation.replace(Screens.ProofRequest, { proofId: state.notificationRecord.id })

      return
    }

    // connection based proof or offer
    if (oobRecord?.outOfBandInvitation.goalCode) {
      const { goalCode } = oobRecord.outOfBandInvitation

      if (goalCode === GoalCodes.proofRequestVerify || goalCode === GoalCodes.proofRequestVerifyOnce) {
        logger?.info(`Connection: Handling ${goalCode} goal code, navigate to ProofRequest`)
        dispatch({ isVisible: false })
        navigation.navigate(Screens.ProofRequest, { proofId: state.notificationRecord.id })
      } else if (goalCode === GoalCodes.credentialOffer) {
        logger?.info(`Connection: Handling ${goalCode} goal code, navigate to CredentialOffer`)
        dispatch({ isVisible: false })
        navigation.navigate(Screens.CredentialOffer, { credentialId: state.notificationRecord.id })
      } else {
        logger?.info(`Connection: Unable to handle ${goalCode} goal code`)
      }
    } else {
      logger?.info('Connection: Handling connection without goal code, navigate to Chat')
      navigation.getParent()?.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [{ name: Stacks.TabStack }, { name: Screens.Chat, params: { connectionId } }],
        })
      )
      dispatch({ isVisible: false })
    }
  }, [connection, oobRecord, state])

  useMemo(() => {
    startTimer()
    return () => abortTimer
  }, [])

  useFocusEffect(
    useCallback(() => {
      startTimer()
      return () => abortTimer
    }, [])
  )

  useEffect(() => {
    if (!state.isVisible || state.notificationRecord) {
      return
    }

    for (const notification of notifications) {
      // no action taken for BasicMessageRecords
      if (notification.type === 'BasicMessageRecord') {
        logger?.info('Connection: BasicMessageRecord, skipping')
        continue
      }

      if (
        (connection && notification.connectionId === connection.id) ||
        (threadId && (notification.threadId === threadId || notification.parentThreadId === threadId))
      ) {
        logger?.info(`Connection: Handling notification ${notification.id}`)

        dispatch({ notificationRecord: notification })
        break
      }
    }
  }, [notifications, state])

  return (
    <Modal
      visible={state.isVisible}
      transparent={true}
      animationType={'slide'}
      onRequestClose={() => {
        dispatch({ isVisible: false })
      }}
    >
      <SafeAreaView style={{ backgroundColor: ColorPallet.brand.modalPrimaryBackground }}>
        <ScrollView style={[styles.container]}>
          <View style={[styles.messageContainer]}>
            <Text
              style={[TextTheme.modalHeadingThree, styles.messageText]}
              testID={testIdWithKey('CredentialOnTheWay')}
            >
              {t('Connection.JustAMoment')}
            </Text>
          </View>

          <View style={[styles.image]}>
            <ConnectionLoading />
          </View>

          {state.shouldShowDelayMessage && (
            <Text style={[TextTheme.modalNormal, styles.delayMessageText]} testID={testIdWithKey('TakingTooLong')}>
              {t('Connection.TakingTooLong')}
            </Text>
          )}
        </ScrollView>
        <View style={[styles.controlsContainer]}>
          <Button
            title={t('Loading.BackToHome')}
            accessibilityLabel={t('Loading.BackToHome')}
            testID={testIdWithKey('BackToHome')}
            onPress={onDismissModalTouched}
            buttonType={ButtonType.ModalSecondary}
          />
        </View>
      </SafeAreaView>
    </Modal>
  )
}

export default Connection
