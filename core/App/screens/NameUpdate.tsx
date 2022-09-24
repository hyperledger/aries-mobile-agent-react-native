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
import { SettingStackParams, Screens } from '../types/navigators'
import { testIdWithKey } from '../utils/testable'

const NameUpdate: React.FC = () => {
  const { t } = useTranslation()
  const { ColorPallet } = useTheme()
  const [state, dispatch] = useContext(StoreContext)
  const [firstName, onChangeFirstName] = useState('')
  const [lastName, onChangeLastName] = useState('')
  const [buttonsActive, setButtonsActive] = useState(false)
  const navigation = useNavigation<StackNavigationProp<[SettingStackParams]>>()

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

  useEffect(() => {
    if (isValid(firstName) && isValid(lastName)) {
      setButtonsActive(true)
    }
  })

  const setDisplayName = () => {
    try {
      dispatch({
        type: DispatchAction.FIRST_NAME_UPDATED,
        payload: [firstName],
      })
      dispatch({
        type: DispatchAction.LAST_NAME_UPDATED,
        payload: [lastName],
      })
      dispatch({
        type: DispatchAction.DID_CREATE_DISPLAY_NAME,
      })
      navigation.navigate(Screens.Settings)
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
        <Button
          title="Submit"
          buttonType={ButtonType.Primary}
          onPress={() => setDisplayName()}
          disabled={!buttonsActive}
        />
      </View>
    </SafeAreaView>
  )
}

export default NameUpdate
