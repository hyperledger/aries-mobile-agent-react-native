import { useCredentialCardParams } from '../../hooks/credential-card-params'
import { Image, Text, View, ViewStyle, useWindowDimensions } from 'react-native'
import { toImageSource } from '../../utils/credential'
import { CredentialCardBrandingProps } from './CredentialCard11'
import { useBranding } from '../../hooks/bundle-resolver'
import { BrandingOverlayType, CredentialOverlay } from '@hyperledger/aries-oca/build/legacy'
import { BrandingOverlay } from '@hyperledger/aries-oca'
import { useTheme } from '../../contexts/theme'
import { TOKENS, useServices } from '../../container-api'
import { useCallback } from 'react'

type Props = CredentialCardBrandingProps & {
  isVerifierCard?: boolean
  logoContainerStyles: ViewStyle
}

const CredentialCardLogoBranding = ({
  credential,
  credName,
  credDefId,
  schemaId,
  proof,
  isVerifierCard = false,
  logoContainerStyles,
}: Props) => {
  const { width } = useWindowDimensions()
  const logoWidth = width * 0.12
  const { TextTheme } = useTheme()
  const params = useCredentialCardParams(credential, schemaId, credDefId, proof, credName)
  const { overlay } = useBranding<CredentialOverlay<BrandingOverlay>>(params)
  const [bundleResolver] = useServices([TOKENS.UTIL_OCA_RESOLVER])
  const textContent =
    bundleResolver.getBrandingOverlayType() === BrandingOverlayType.Branding10
      ? (overlay.metaOverlay?.name ?? overlay.metaOverlay?.issuer ?? 'C')?.charAt(0).toUpperCase()
      : (overlay.metaOverlay?.issuer ?? 'I')?.charAt(0).toUpperCase()
  const getTextColor = useCallback(() => {
    if (isVerifierCard) return '#000'
    return overlay.brandingOverlay?.secondaryBackgroundColor ?? '#000'
  }, [isVerifierCard, overlay])
  return (
    <View style={logoContainerStyles}>
      {overlay.brandingOverlay?.logo ? (
        <Image
          source={toImageSource(overlay.brandingOverlay?.logo)}
          style={{
            resizeMode: 'cover',
            width: logoWidth,
            height: logoWidth,
            borderRadius: 8,
          }}
        />
      ) : (
        <Text
          style={[
            TextTheme.bold,
            {
              fontSize: 0.5 * logoWidth,
              alignSelf: 'center',
              color: getTextColor(),
            },
          ]}
        >
          {textContent}
        </Text>
      )}
    </View>
  )
}

export default CredentialCardLogoBranding
