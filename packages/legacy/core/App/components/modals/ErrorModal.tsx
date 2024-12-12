import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, StyleSheet, StatusBar, DeviceEventEmitter, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { EventTypes } from '../../constants'
import { TOKENS, useServices } from '../../container-api'
import { useTheme } from '../../contexts/theme'
import { BifoldError } from '../../types/error'
import InfoBox, { InfoBoxType } from '../misc/InfoBox'

interface ErrorModalProps {
  enableReport?: boolean
}

const ErrorModal: React.FC<ErrorModalProps> = ({ enableReport }) => {
  const { height } = useWindowDimensions()
  const { t } = useTranslation()
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [error, setError] = useState<BifoldError>()
  const [reported, setReported] = useState(false)
  const [logger] = useServices([TOKENS.UTIL_LOGGER])
  const { ColorPallet } = useTheme()
  const styles = StyleSheet.create({
    container: {
      minHeight: height,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: ColorPallet.brand.primaryBackground,
    },
  })

  const onDismissModalTouched = useCallback(() => {
    setModalVisible(false)
  }, [])

  const report = useCallback(() => {
    if (error) {
      logger.report(error)
    }
    setReported(true)
  }, [logger, error])

  useEffect(() => {
    const errorAddedHandle = DeviceEventEmitter.addListener(EventTypes.ERROR_ADDED, (err: BifoldError) => {
      if (err.title && err.message) {
        setError(err)
        setReported(false)
        setModalVisible(true)
      }
    })

    const errorRemovedHandle = DeviceEventEmitter.addListener(EventTypes.ERROR_REMOVED, () => {
      setError(undefined)
      setModalVisible(false)
    })

    return () => {
      errorAddedHandle.remove()
      errorRemovedHandle.remove()
    }
  }, [])

  const formattedMessageForError = (err: BifoldError | null): string | undefined => {
    if (!err) {
      return undefined
    }

    return `${t('Error.ErrorCode')} ${err.code} - ${err.message}`
  }

  return (
    <Modal visible={modalVisible} transparent={true}>
      <StatusBar hidden={true} />
      <SafeAreaView style={styles.container}>
        <InfoBox
          notificationType={InfoBoxType.Error}
          title={error ? error.title : t('Error.Unknown')}
          description={error ? error.description : t('Error.Problem')}
          message={formattedMessageForError(error ?? null)}
          onCallToActionPressed={onDismissModalTouched}
          secondaryCallToActionTitle={reported ? t('Error.Reported') : t('Error.ReportThisProblem')}
          secondaryCallToActionDisabled={reported}
          secondaryCallToActionIcon={reported ? <Icon name={'check-circle'} size={18} color={ColorPallet.semantic.success} /> : undefined}
          secondaryCallToActionPressed={enableReport && error ? report : undefined}
        />
      </SafeAreaView>
    </Modal>
  )
}

export default ErrorModal
