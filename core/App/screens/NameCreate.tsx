import { useNavigation } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import Button, { ButtonType } from '../components/buttons/Button'
import TextInput from '../components/inputs/TextInput'
import AlertModal from '../components/modals/AlertModal'
import Label from '../components/texts/Label'
import { DispatchAction } from '../contexts/reducers/store'
import { StoreContext } from '../contexts/store'
import { useTheme } from '../contexts/theme'
import { AuthenticateStackParams, Screens } from '../types/navigators'
import { testIdWithKey } from '../utils/testable'

const NameCreate: React.FC = () => {
  const { t } = useTranslation()
  const [state, dispatch] = useContext(StoreContext)
  const { ColorPallet } = useTheme()
  const [firstName, onChangeFirstName] = useState('')
  const [lastName, onChangeLastName] = useState('')
  const navigation = useNavigation<StackNavigationProp<[AuthenticateStackParams]>>()

  const styles = StyleSheet.create({
    title: {
      color: ColorPallet.grayscale.white,
      fontSize: 16,
    },
    warningText: {
      fontWeight: 'bold',
      color: ColorPallet.grayscale.white,
      paddingRight: 10,
    },
    text: {
      color: ColorPallet.grayscale.white,
      marginBottom: 10,
      fontSize: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
    },
  })

  const isValid = (name: string) => {
    if (name.length >= 2) {
      return true
    } else return false
  }

  const setDisplayName = (name: string) => {
    try {
      if (isValid(name) == true) {
        dispatch({
          type: DispatchAction.FIRST_NAME_UPDATED,
          payload: [name],
        })
        dispatch({
          type: DispatchAction.DID_CREATE_DISPLAY_NAME,
        })
        navigation.navigate(Screens.CreatePin)
      } else {
        // name error
      }
    } catch {
      // dispatch error
    }
  }

  return (
    <SafeAreaView>
      <View style={{ padding: 20 }}>
        <Text style={styles.title}>Please enter your name.</Text>
        <View style={styles.row}>
          <Icon name={'alert-circle'} size={26} color={ColorPallet.notification.infoIcon} style={{ marginRight: 10 }} />
          <Text style={styles.warningText}>
            You will be using this name with businesses and services to obtain and share sensitive data.
          </Text>
        </View>
        <Text style={styles.text}>
          We recommend using your full legal name, or a version of your name that banks and governments would recognize
          as uniquely yours.
        </Text>
        <TextInput label="First name" onChangeText={onChangeFirstName} value={firstName} placeholder="First name" />
        <TextInput label="Last name" onChangeText={onChangeLastName} value={lastName} placeholder="Last name" />
        <Text style={styles.text}>You can update this at any time in your settings</Text>
        <Button
          title="Confirm"
          buttonType={ButtonType.Primary}
          onPress={() => setDisplayName(firstName + ' ' + lastName)}
        />
      </View>
    </SafeAreaView>
  )
}

export default NameCreate
