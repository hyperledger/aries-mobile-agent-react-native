import { ParamListBase } from '@react-navigation/core'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

// eslint-disable-next-line import/no-named-as-default
import { ButtonType } from '../../../components/buttons/Button-api'
import KeyboardView from '../../../components/views/KeyboardView'
import { TOKENS, useContainer } from '../../../container-api'
import { useAnimatedComponents } from '../../../contexts/animated-components'
import { useTheme } from '../../../contexts/theme'
import { Screens } from '../../../types/navigators'
import { testIdWithKey } from '../../../utils/testable'
import { useHistory } from '../context/history'

import SingleSelectBlock, { BlockSelection } from './components/SingleSelectBlock'

interface HistorySettingsProps extends StackScreenProps<ParamListBase, Screens.HistorySettings> {}

const HistorySettings: React.FC<HistorySettingsProps> = () => {
  //   const updatePin = (route.params as any)?.updatePin
  const [continueEnabled] = useState(true)
  const [isLoading] = useState(false)
  const { t } = useTranslation()
  const { historySettingsOptionList, handleStoreHistorySettings, getStoredHistorySettingsOption } = useHistory()

  const { ColorPallet, TextTheme } = useTheme()
  const { ButtonLoading } = useAnimatedComponents()
  const actionButtonLabel = t('Global.SaveSettings')
  const actionButtonTestId = testIdWithKey('Save')
  const container = useContainer()
  const Button = container.resolve(TOKENS.COMP_BUTTON)

  //State
  const [initialHistory, setInitialHistory] = useState<BlockSelection | undefined>() // Initial history settings option
  const [historyOptionSelected, setHistoryOptionSelected] = useState<BlockSelection | undefined>(initialHistory) // Selected history settings option

  const style = StyleSheet.create({
    screenContainer: {
      height: '100%',
      backgroundColor: ColorPallet.brand.primaryBackground,
      padding: 20,
      justifyContent: 'space-between',
    },
    title: {
      marginTop: 16,
    },
    deleteButtonText: {
      alignSelf: 'flex-start',
      color: '#CD0000', //TODO: Use Bifold alert color
    },
    deleteButton: {
      marginBottom: 16,
    },
    gap: {
      marginTop: 10,
      marginBottom: 10,
    },

    // below used as helpful labels for views, no properties needed atp
    contentContainer: {},
    controlsContainer: {},
  })

  const onSelectHistory = (newHistoryOption: BlockSelection) => {
    // console.log('on select history:', JSON.stringify(newHistoryOption))
    //TODO: Impliment warning of old history clearing on the below condition
    // if (newHistoryOption && newHistoryOption.key) {
    //   if ((initialHistory?.key as number) > newHistoryOption.key) {
    //     setShowWarningDisclaimer(true)
    //   } else {
    //     setShowWarningDisclaimer(false)
    //   }
    // }
    setHistoryOptionSelected(newHistoryOption)
    //TODO: Impliment success alert
    // setIsSuccess(false)
  }

  const handleSaveHistorySettings = async () => {
    try {
      if (!historyOptionSelected && initialHistory) {
        await handleStoreHistorySettings(initialHistory)
      } else {
        await handleStoreHistorySettings(historyOptionSelected)
      }
      //TODO: Impliment Alert
      //   setShowWarningDisclaimer(false)
      //   setIsSuccess(true)
      //   scrollViewRef.current?.scrollTo({
      //     y: 0,
      //     animated: true,
      //   })
      // console.log('History option saved')
    } catch (e: unknown) {
      //TODO: Impliment Alert
      // console.log('Error:', e)
      //   log(`[${SettingsActivityHistory.name}]: Handle history save: ${e}`, LogLevel.error)
      //   Toast.show({
      //     type: 'error',
      //     text1: (e as Error)?.message || t('Global.Failure'),
      //   })
    }
  }

  /**
   * Find current set history
   */
  let storedHistorySettingsOption: string | BlockSelection | null | undefined
  async function getSavedHistorySettingsOption() {
    storedHistorySettingsOption = await getStoredHistorySettingsOption()
    if (storedHistorySettingsOption === 'Never') {
      //TODO: Impliment "Never" option
      //   setIsActivityHistoryDisabled(true)
    } else {
      setInitialHistory(
        storedHistorySettingsOption
          ? historySettingsOptionList.find((l) => l.id === storedHistorySettingsOption)
          : undefined
      )
    }
  }

  useEffect(() => {
    getSavedHistorySettingsOption()
  }, [])

  return (
    <KeyboardView>
      <View style={style.screenContainer}>
        <View style={style.contentContainer}>
          <View>
            <Text style={[style.title, TextTheme.headerTitle]}>{t('ActivityHistory.Title')}</Text>
            <Text style={[style.title, TextTheme.normal]}>{t('ActivityHistory.Description')}</Text>
            <View style={style.gap} />
            <SingleSelectBlock
              initialSelect={initialHistory}
              selection={historySettingsOptionList}
              onSelect={onSelectHistory}
            />
          </View>
        </View>
        <View style={style.controlsContainer}>
          <Button
            title={actionButtonLabel}
            testID={actionButtonTestId}
            accessibilityLabel={actionButtonLabel}
            buttonType={ButtonType.Primary}
            onPress={handleSaveHistorySettings}
          >
            {!continueEnabled && isLoading ? <ButtonLoading /> : null}
          </Button>
          <View style={{ marginBottom: 10 }} />
          <Button
            title={t('ActivityHistory.StopKeepingHistory')}
            testID={actionButtonTestId}
            accessibilityLabel={actionButtonLabel}
            buttonType={ButtonType.Secondary}
            onPress={async () => {
              // console.log('save history')
            }}
          >
            {!continueEnabled && isLoading ? <ButtonLoading /> : null}
          </Button>
        </View>
      </View>
    </KeyboardView>
  )
}

export default HistorySettings
