import { CaptureBaseAttributeType } from '@hyperledger/aries-oca'
import { Attribute, Field } from '@hyperledger/aries-oca/build/legacy'
import startCase from 'lodash.startcase'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { hiddenFieldValue } from '../../constants'
import { useTheme } from '../../contexts/theme'
import { isDataUrl } from '../../utils/helpers'
import { testIdWithKey } from '../../utils/testable'

import RecordBinaryField from './RecordBinaryField'
import RecordDateIntField from './RecordDateIntField'

interface RecordFieldProps {
  field: Field
  hideFieldValue?: boolean
  hideBottomBorder?: boolean
  shown?: boolean
  onToggleViewPressed?: () => void
  fieldLabel?: (field: Field) => React.ReactElement | null
  fieldValue?: (field: Field) => React.ReactElement | null
}

export const validEncoding = 'base64'
export const validFormat = new RegExp('^image/(jpeg|png|jpg)')

interface AttributeValueParams {
  field: Attribute
  shown?: boolean
  style?: Record<string, unknown>
}

export const AttributeValue: React.FC<AttributeValueParams> = ({ field, style, shown }) => {
  const { ListItems } = useTheme()
  const styles = StyleSheet.create({
    text: {
      ...ListItems.recordAttributeText,
    },
  })
  if (
    (field.encoding == validEncoding && field.format && validFormat.test(field.format) && field.value) ||
    isDataUrl(field.value)
  ) {
    return <RecordBinaryField attributeValue={field.value as string} style={style} shown={shown} />
  }
  if (field.type == CaptureBaseAttributeType.DateInt || field.type == CaptureBaseAttributeType.DateTime) {
    return <RecordDateIntField field={field} style={style} shown={shown} />
  }
  return (
    <Text style={style || styles.text} testID={testIdWithKey('AttributeValue')}>
      {shown ? field.value : hiddenFieldValue}
    </Text>
  )
}

const RecordField: React.FC<RecordFieldProps> = ({
  field,
  hideFieldValue = false,
  hideBottomBorder = false,
  shown = !hideFieldValue,
  onToggleViewPressed = () => undefined,
  fieldLabel = null,
  fieldValue = null,
}) => {
  const { t } = useTranslation()
  const { ListItems, RecordFieldSeparatorTheme } = useTheme()
  const styles = StyleSheet.create({
    container: {
      ...ListItems.recordContainer,
      paddingHorizontal: 25,
      paddingTop: 16,
    },
    link: {
      ...ListItems.recordLink,
      paddingVertical: 2,
    },
    valueContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 5,
    },
    valueText: {
      ...ListItems.recordAttributeText,
      paddingVertical: 4,
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.valueContainer}>
        {fieldLabel ? (
          fieldLabel(field)
        ) : (
          <Text style={ListItems.recordAttributeLabel} testID={testIdWithKey('AttributeName')}>
            {field.label ?? startCase(field.name || '')}
          </Text>
        )}

        {hideFieldValue ? (
          <TouchableOpacity
            accessible={true}
            accessibilityLabel={shown ? t('Record.Hide') : t('Record.Show')}
            testID={testIdWithKey('ShowHide')}
            activeOpacity={1}
            onPress={onToggleViewPressed}
            style={styles.link}
          >
            <Text style={ListItems.recordLink}>{shown ? t('Record.Hide') : t('Record.Show')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.valueContainer}>
        {fieldValue ? (
          fieldValue(field)
        ) : (
          <>
            <View style={styles.valueText}>
              <AttributeValue field={field as Attribute} shown={shown} />
            </View>
          </>
        )}
      </View>
      {<View style={[RecordFieldSeparatorTheme, hideBottomBorder && { borderBottomWidth: 0 }]} />}
    </View>
  )
}

export default RecordField
