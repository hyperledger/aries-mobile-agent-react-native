import React, { useState, useEffect, useContext } from 'react'
import { useHistory } from 'react-router-native'
import * as Keychain from 'react-native-keychain'
import AsyncStorage from '@react-native-community/async-storage'

import LoadingOverlay from '../components/modals/LoadingOverlay'

import { ErrorsContext } from '../contexts/Errors'

interface IEntryPoint {
  authenticated: boolean
}

function EntryPoint(props: IEntryPoint) {
  const history = useHistory()
  const errors = useContext<any>(ErrorsContext)

  const [loadingOverlayVisible, setLoadingOverlayVisible] = useState(false)

  useEffect(() => {
    // Checking launch status to avoid issues with React Native Keychain
    const launchPromise = new Promise((resolve, reject) => {
      const getData = async () => {
        try {
          const value = await AsyncStorage.getItem('firstLaunch')
          if (value == null) {
            // Detecting a first time launch, resetting keychain
            console.log('First launch. Clearing keychain.')
            await AsyncStorage.setItem('firstLaunch', 'false')
            await Keychain.resetGenericPassword({ service: 'passcode' })
            await Keychain.resetGenericPassword({ service: 'setupWizard' })
            resolve(null)
          } else {
            resolve(null)
          }
        } catch (e) {
          // error
        }
      }
      getData()
    })

    launchPromise.then(() => {
      if (props.authenticated) {
        history.push('/home')
      } else {
        async function entry() {
          try {
            const passcodeCreated: any = await Keychain.getGenericPassword({
              service: 'setupWizard',
            })

            if (passcodeCreated.password == 'true') {
              history.push('/pin/enter')
            } else {
              history.push('/setup-wizard')
            }
          } catch (e) {
            errors.setVisible(true)
            errors.setText('Error!')
            errors.setPath('/')

            console.error('Error During Startup:', e)
          }
        }
        entry()
      }
    })
  }, [])

  return <LoadingOverlay visible={loadingOverlayVisible} />
}

export default EntryPoint
