import { useTheme } from '../../contexts/theme'
import { Image, StyleProp, Text, TextStyle } from 'react-native'
import { isDataUrl } from '../../utils/helpers'
import { CredentialCard11And12Theme } from '../../theme'
import { testIdWithKey } from '../../utils/testable'

type AttributeValueProps = {
  value: string | number | null
  styles?: StyleProp<TextStyle>
}

const AttributeValue = ({ value, styles }: AttributeValueProps) => {
  const { TextTheme } = useTheme()
  return (
    <>
      {isDataUrl(value) ? (
        <Image style={CredentialCard11And12Theme.imageAttr} source={{ uri: value as string }}></Image>
      ) : (
        <Text style={[TextTheme.bold, styles]} testID={testIdWithKey('AttributeValue')}>
          {value}
        </Text>
      )}
    </>
  )
}

export default AttributeValue
