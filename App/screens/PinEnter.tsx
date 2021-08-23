import React, { useState } from 'react'
import { Alert, Keyboard } from 'react-native'
import * as Keychain from 'react-native-keychain'

import { TextInput, SafeAreaScrollView, Button } from 'components'

interface Props {
  route: any
}

const PinEnter: React.FC<Props> = ({ route }) => {
  const [pin, setPin] = useState('')

  const checkPin = async (pin: string) => {
    const { password } = await Keychain.getGenericPassword({ service: 'passcode' })
    if (JSON.stringify(pin) === password) {
      route.params.setAuthenticated(true)
    } else {
      Alert.alert('Incorrect Pin')
    }
  }

  return (
    <SafeAreaScrollView>
      <TextInput
        label="Enter Pin"
        placeholder="6 Digit Pin"
        autoFocus
        maxLength={6}
        keyboardType="numeric"
        secureTextEntry={true}
        value={pin}
        onChangeText={(pin: string) => {
          setPin(pin.replace(/[^0-9]/g, ''))
          if (pin.length == 6) {
            Keyboard.dismiss()
          }
        }}
      />
      <Button
        title="Submit"
        onPress={() => {
          Keyboard.dismiss()
          checkPin(pin)
        }}
      />
    </SafeAreaScrollView>
  )
}

export default PinEnter
