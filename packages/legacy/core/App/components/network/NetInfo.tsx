import * as React from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Toast from 'react-native-toast-message'
import { useNetwork } from '../../contexts/network'
import { ToastType } from '../../components/toast/BaseToast'
import { TOKENS, useServices } from '../../container-api'

const NetInfo: React.FC = () => {
  const { silentAssertConnectedNetwork, assertInternetReachable, assertMediatorReachable } = useNetwork()
  const [{ disableMediatorCheck }] = useServices([TOKENS.CONFIG])
  const { t } = useTranslation()
  const [hasShown, setHasShown] = useState(false)

  const isConnected = silentAssertConnectedNetwork()

  useEffect(() => {
    const _showNetworkWarning = () => {
      setHasShown(true)
      Toast.show({
        type: ToastType.Error,
        autoHide: true,
        text1: t('NetInfo.NoInternetConnectionTitle'),
      })
    }
    // Network is available, do further testing according to CFG.disableMediatorCheck
    if (!disableMediatorCheck) {
      // Network is available
      if (isConnected) {
        // Check mediator socket, also assert internet reachable
        assertMediatorReachable().then((status) => {
          if (status) {
            Toast.hide()
            return
          } else {
            // Network is available but cannot access nediator, display toast
            _showNetworkWarning()
          }
        })
        return
      } else if (!hasShown) {
        _showNetworkWarning()
      }
      return
    } else {
      // Check internetReachable by connecting test beacon urls
      assertInternetReachable().then((status) => {
        if (status) {
          Toast.hide()
          return
        } else if (null === status) {
          // keep silent when the internet status not yet assert
          return
          /*
          Toast.show({
            type: ToastType.Info,
            autoHide: false,
            text1: "Checking internet reachable",
          })
          */
        } else if (!hasShown) {
          _showNetworkWarning()
        }
      })
    }
  }, [
    isConnected,
    disableMediatorCheck,
    assertInternetReachable,
    assertMediatorReachable,
    t,
    hasShown
  ])

  return null
}

export default NetInfo
