import { useTheme } from '../../contexts/theme'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import { testIdWithKey } from '../../utils/testable'
import { CredentialCard11And12Theme } from '../../theme'
import Icon from 'react-native-vector-icons/MaterialIcons'

type Props = {
  status?: 'error' | 'warn'
}

const CredentialCardStatus = ({ status }: Props) => {
  const { ColorPallet } = useTheme()
  const { width } = useWindowDimensions()
  const logoWidth = width * 0.12
  const styles = StyleSheet.create({
    statusContainer: {
      ...CredentialCard11And12Theme.statusContainer,
      height: logoWidth,
      width: logoWidth,
    },
  })
  const Status: React.FC<{ status?: 'error' | 'warn' }> = ({ status }) => {
    return (
      <>
        {status ? (
          <View
            style={[
              styles.statusContainer,
              {
                backgroundColor: status === 'error' ? ColorPallet.notification.error : ColorPallet.notification.warn,
              },
            ]}
          >
            <Icon
              size={0.7 * logoWidth}
              style={{ color: status === 'error' ? ColorPallet.semantic.error : ColorPallet.notification.warnIcon }}
              name={status === 'error' ? 'error' : 'warning'}
            />
          </View>
        ) : (
          <View style={styles.statusContainer} />
        )}
      </>
    )
  }

  return (
    <View
      testID={testIdWithKey('CredentialCardStatus')}
      style={[styles.statusContainer, { position: 'absolute', right: 0, top: 0 }]}
    >
      <Status status={status} />
    </View>
  )
}

export default CredentialCardStatus
