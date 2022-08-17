import React, { useState } from 'react'
import { StyleSheet, Text, View, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Biometrics from '../assets/img/biometrics.svg'
import Button, { ButtonType } from '../components/buttons/Button'
import { useAuth } from '../contexts/auth'
import { DispatchAction } from '../contexts/reducers/store'
import { useStore } from '../contexts/store'
import { useTheme } from '../contexts/theme'
import { testIdWithKey } from '../utils/testable'

const UseBiometry: React.FC = () => {
  const [, dispatch] = useStore()
  const { convertToUseBiometrics } = useAuth()
  const [isEnabled, setIsEnabled] = useState(false)

  const { ColorPallet, TextTheme } = useTheme()
  const styles = StyleSheet.create({
    container: {
      flexGrow: 2,
      flexDirection: 'column',
      paddingHorizontal: 25,
    },
    image: {
      minWidth: 200,
      minHeight: 200,
      marginBottom: 66,
    },
  })
  const continueTouched = async () => {
    if (isEnabled) {
      await convertToUseBiometrics()
    }

    dispatch({
      type: DispatchAction.USE_BIOMETRY,
      payload: [isEnabled],
    })
  }

  const toggleSwitch = () => setIsEnabled((previousState) => !previousState)

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flexGrow: 1 }}>
        <View style={{ alignItems: 'center' }}>
          <Biometrics style={[styles.image]} />
        </View>
        <Text style={[TextTheme.normal]}>
          Unlock the wallet with your phone's biometrics instead of your wallet PIN.
        </Text>
        <Text></Text>
        <Text style={[TextTheme.normal]}>
          Using biometrics means that all fingerprints or face ID added on this phone will have access to your wallet.
          <Text style={[TextTheme.normal, { fontWeight: 'bold' }]}> Ensure only you have access to your wallet.</Text>
        </Text>
        <View
          style={{
            flexDirection: 'row',
            marginVertical: 30,
          }}
        >
          <View style={{ flexShrink: 1 }}>
            <Text style={[TextTheme.normal, { fontWeight: 'bold' }]}>Use biometrics to unlock wallet?</Text>
          </View>
          <View style={{ justifyContent: 'center' }}>
            <Switch
              trackColor={{ false: ColorPallet.grayscale.lightGrey, true: ColorPallet.brand.primaryDisabled }}
              thumbColor={isEnabled ? ColorPallet.brand.primary : ColorPallet.grayscale.mediumGrey}
              ios_backgroundColor={ColorPallet.grayscale.lightGrey}
              onValueChange={toggleSwitch}
              value={isEnabled}
            />
          </View>
        </View>
        <View style={{ flexGrow: 1, justifyContent: 'flex-end' }}>
          <Button
            title={'Continue'}
            accessibilityLabel={'Continue'}
            testID={testIdWithKey('Continue')}
            onPress={continueTouched}
            buttonType={ButtonType.Primary}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default UseBiometry
