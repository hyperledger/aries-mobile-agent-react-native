import React from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, StyleSheet, View, Text, Dimensions, TouchableOpacity, TouchableWithoutFeedback } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { useTheme } from '../../contexts/theme'
import { GenericFn } from '../../types/fn'
import { testIdWithKey } from '../../utils/testable'
import Button, { ButtonType } from '../buttons/Button'

interface AppGuideModalProps {
  title: string
  description?: string
  onCallToActionPressed?: GenericFn
  onCallToActionLabel?: string
  onSecondCallToActionPressed?: GenericFn
  onSecondCallToActionLabel?: string
  onDismissPressed: GenericFn
}

const AppGuideModal: React.FC<AppGuideModalProps> = ({
  title,
  description,
  onCallToActionPressed,
  onCallToActionLabel,
  onSecondCallToActionPressed,
  onSecondCallToActionLabel,
  onDismissPressed,
}) => {
  const { height, width } = Dimensions.get('window')
  const { t } = useTranslation()
  const { TextTheme, ColorPallet } = useTheme()
  const iconSize = 30
  const dismissIconName = 'clear'
  const iconColor = ColorPallet.notification.infoIcon

  const styles = StyleSheet.create({
    modalCenter: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: ColorPallet.notification.popupOverlay,
      padding: 10,
      minHeight: height,
      minWidth: width,
    },
    container: {
      backgroundColor: ColorPallet.notification.info,
      borderColor: ColorPallet.notification.infoBorder,
      borderRadius: 5,
      borderWidth: 1,
      padding: 10,
      width: width - 50,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 5,
      paddingTop: 5,
    },
    headerTextContainer: {
      flexGrow: 1,
    },
    headerText: {
      ...TextTheme.normal,
      fontWeight: 'bold',
      alignSelf: 'flex-start',
      color: ColorPallet.notification.infoText,
    },
    bodyText: {
      ...TextTheme.normal,
      flexShrink: 1,
      marginVertical: 16,
      color: ColorPallet.notification.infoText,
    },
    dismissIcon: {
      alignSelf: 'flex-end',
    },
  })

  return (
    <Modal transparent>
      <TouchableOpacity onPress={onDismissPressed} accessible={false}>
        <View style={styles.modalCenter}>
          <TouchableWithoutFeedback accessible={false}>
            <View style={styles.container}>
              <View style={styles.headerContainer}>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerText} testID={testIdWithKey('HeaderText')}>
                    {title}
                  </Text>
                </View>
                <View style={[styles.dismissIcon]} testID={testIdWithKey('Dismiss')}>
                  <TouchableOpacity onPress={onDismissPressed}>
                    <Icon name={dismissIconName} size={iconSize} color={iconColor} />
                  </TouchableOpacity>
                </View>
              </View>
              <View>
                <Text style={styles.bodyText} testID={testIdWithKey('BodyText')}>
                  {description}
                </Text>
                {onCallToActionPressed && (
                  <View style={{ width: '100%', marginBottom: 10 }}>
                    <Button
                      title={onCallToActionLabel || t('Global.Okay')}
                      accessibilityLabel={onCallToActionLabel || t('Global.Okay')}
                      testID={testIdWithKey('Okay')}
                      buttonType={ButtonType.Primary}
                      onPress={onCallToActionPressed}
                    />
                  </View>
                )}
                {onSecondCallToActionPressed && (
                  <Button
                    title={onSecondCallToActionLabel || t('Global.Okay')}
                    accessibilityLabel={onSecondCallToActionLabel || t('Global.Okay')}
                    testID={testIdWithKey('Okay')}
                    buttonType={ButtonType.Secondary}
                    onPress={onSecondCallToActionPressed}
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

export default AppGuideModal
