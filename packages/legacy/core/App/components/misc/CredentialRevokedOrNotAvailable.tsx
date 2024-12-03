import { Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { CredentialCard11And12Theme } from '../../theme'
import { testIdWithKey } from '../../utils/testable'

type Props = {
  message: string
}

const CredentialRevokedOrNotAvailable = ({ message }: Props) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
      <Icon style={CredentialCard11And12Theme.errorIcon} name="close" size={30} />

      <Text
        style={CredentialCard11And12Theme.errorText}
        testID={testIdWithKey('RevokedOrNotAvailable')}
        numberOfLines={1}
      >
        {message}
      </Text>
    </View>
  )
}

export default CredentialRevokedOrNotAvailable
