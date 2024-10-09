import { CredentialState } from '@credo-ts/core'
import { useCredentialByState } from '@credo-ts/react-hooks'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

import { TOKENS, useServices } from '../../container-api'
import { useTheme } from '../../contexts/theme'

const offset = 25

interface HomeFooterViewProps {
  children?: any
}

const HomeFooterView: React.FC<HomeFooterViewProps> = ({ children }) => {
  const credentials = [
    ...useCredentialByState(CredentialState.CredentialReceived),
    ...useCredentialByState(CredentialState.Done),
  ]
  const [{ useNotifications }] = useServices([TOKENS.NOTIFICATIONS])
  const notifications = useNotifications({})
  const { HomeTheme, TextTheme } = useTheme()
  const { t } = useTranslation()
  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: offset,
      paddingBottom: offset * 3,
    },

    messageContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 35,
      marginHorizontal: offset,
    },
  })

  const displayMessage = (credentialCount: number) => {
    if (typeof credentialCount === 'undefined' && credentialCount >= 0) {
      throw new Error('Credential count cannot be undefined')
    }

    let credentialMsg

    if (credentialCount === 1) {
      credentialMsg = (
        <Text>
          {t('Home.YouHave')} <Text style={{ fontWeight: TextTheme.bold.fontWeight }}>{credentialCount}</Text>{' '}
          {t('Home.Credential')} {t('Home.InYourWallet')}
        </Text>
      )
    } else if (credentialCount > 1) {
      credentialMsg = (
        <Text>
          {t('Home.YouHave')} <Text style={{ fontWeight: TextTheme.bold.fontWeight }}>{credentialCount}</Text>{' '}
          {t('Home.Credentials')} {t('Home.InYourWallet')}
        </Text>
      )
    } else {
      credentialMsg = t('Home.NoCredentials')
    }

    return (
      <>
        {notifications.length === 0 && (
          <View style={styles.messageContainer}>
            <Text adjustsFontSizeToFit style={[HomeTheme.welcomeHeader, { marginTop: offset, marginBottom: 20 }]}>
              {t('Home.Welcome')}
            </Text>
          </View>
        )}
        <Text style={[HomeTheme.credentialMsg, { marginTop: offset, textAlign: 'center' }]}>{credentialMsg}</Text>
      </>
    )
  }

  return (
    <View>
      <View style={styles.container}>{displayMessage(credentials.length)}</View>
      {children}
    </View>
  )
}

export default HomeFooterView
