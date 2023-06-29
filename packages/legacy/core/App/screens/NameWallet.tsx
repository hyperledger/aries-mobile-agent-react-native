import { useNavigation } from '@react-navigation/core'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

import ButtonLoading from '../components/animated/ButtonLoading'
import Button, { ButtonType } from '../components/buttons/Button'
import LimitedTextInput from '../components/inputs/LimitedTextInput'
import { InfoBoxType } from '../components/misc/InfoBox'
import PopupModal from '../components/modals/PopupModal'
import KeyboardView from '../components/views/KeyboardView'
import { DispatchAction } from '../contexts/reducers/store'
import { useStore } from '../contexts/store'
import { useTheme } from '../contexts/theme'
import { Screens } from '../types/navigators'
import { generateRandomWalletName } from '../utils/helpers'
import { testIdWithKey } from '../utils/testable'

type ErrorState = {
  visible: boolean
  title: string
  description: string
}

const NameWallet: React.FC = () => {
  const { t } = useTranslation()
  const { ColorPallet, TextTheme, Assets } = useTheme()
  const navigation = useNavigation()
  const [walletName, setWalletName] = useState(generateRandomWalletName())
  const [, dispatch] = useStore()
  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState<ErrorState>({
    visible: false,
    title: '',
    description: '',
  })

  const styles = StyleSheet.create({
    screenContainer: {
      height: '100%',
      backgroundColor: ColorPallet.brand.primaryBackground,
      padding: 20,
      justifyContent: 'space-between',
    },

    contentContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    // below used as helpful label for view, no properties needed atp
    controlsContainer: {},

    buttonContainer: {
      width: '100%',
    },
  })

  const handleChangeText = (text: string) => {
    setWalletName(text)
  }

  const handleContinuePressed = () => {
    if (walletName.length < 1) {
      setErrorState({
        title: t('NameWallet.EmptyNameTitle'),
        description: t('NameWallet.EmptyNameDescription'),
        visible: true,
      })
    } else if (walletName.length > 50) {
      setErrorState({
        title: t('NameWallet.CharCountTitle'),
        description: t('NameWallet.CharCountDescription'),
        visible: true,
      })
    } else {
      setLoading(true)
      dispatch({
        type: DispatchAction.UPDATE_WALLET_NAME,
        payload: [walletName],
      })
      dispatch({
        type: DispatchAction.DID_NAME_WALLET,
        payload: [true],
      })
      navigation.navigate({ name: Screens.UseBiometry } as never)
    }
  }

  const handleDismissError = () => {
    setErrorState((prev) => ({ ...prev, visible: false }))
  }

  return (
    <KeyboardView>
      <View style={styles.screenContainer}>
        <View style={styles.contentContainer}>
          <Assets.svg.contactBook height={100} style={{ marginVertical: 20 }} />
          <Text style={[TextTheme.normal, { width: '100%', marginBottom: 16 }]}>{t('NameWallet.ThisIsTheName')}</Text>
          <View style={{ width: '100%' }}>
            <LimitedTextInput
              defaultValue={walletName}
              label={t('NameWallet.NameYourWallet')}
              limit={50}
              handleChangeText={handleChangeText}
              accessibilityLabel={t('NameWallet.NameYourWallet')}
              testID={testIdWithKey('NameInput')}
            />
          </View>
        </View>
        <View style={styles.controlsContainer}>
          <View style={styles.buttonContainer}>
            <Button
              title={t('Global.Continue')}
              buttonType={ButtonType.Primary}
              testID={testIdWithKey('Continue')}
              accessibilityLabel={t('Global.Continue')}
              onPress={handleContinuePressed}
              disabled={loading}
            >
              {loading && <ButtonLoading />}
            </Button>
          </View>
        </View>
      </View>
      {errorState.visible && (
        <PopupModal
          notificationType={InfoBoxType.Info}
          onCallToActionLabel={t('Global.Okay')}
          onCallToActionPressed={handleDismissError}
          title={errorState.title}
          description={errorState.description}
        />
      )}
    </KeyboardView>
  )
}

export default NameWallet
