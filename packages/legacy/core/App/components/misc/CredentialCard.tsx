import { CredentialExchangeRecord, W3cCredentialRecord } from '@credo-ts/core'
import { Attribute, BrandingOverlayType, Predicate } from '@hyperledger/aries-oca/build/legacy'
import React from 'react'
import { ViewStyle } from 'react-native'

import { TOKENS, useServices } from '../../container-api'
import { useTheme } from '../../contexts/theme'
import { GenericFn } from '../../types/fn'

import CredentialCard10 from './CredentialCard10'
import CredentialCard11 from './CredentialCard11'
import CredentialCard12 from './CredentialCard12'
import OpenIDCredentialCard from '../../modules/openid/components/OpenIDCredentialCard'
import { GenericCredentialExchangeRecord } from '../../types/credentials'

interface CredentialCardProps {
  credential?: GenericCredentialExchangeRecord
  credDefId?: string
  schemaId?: string
  credName?: string
  onPress?: GenericFn
  style?: ViewStyle
  proof?: boolean
  displayItems?: (Attribute | Predicate)[]
  existsInWallet?: boolean
  satisfiedPredicates?: boolean
  hasAltCredentials?: boolean
  handleAltCredChange?: () => void
}

const CredentialCard: React.FC<CredentialCardProps> = ({
  credential,
  credDefId,
  schemaId,
  proof,
  displayItems,
  credName,
  existsInWallet,
  satisfiedPredicates,
  hasAltCredentials,
  handleAltCredChange,
  style = {},
  onPress = undefined,
}) => {
  // add ability to reference credential by ID, allows us to get past react hook restrictions
  const [bundleResolver] = useServices([TOKENS.UTIL_OCA_RESOLVER])
  const { ColorPallet } = useTheme()
  const getCredOverlayType = (type: BrandingOverlayType) => {
    if (proof) {
      if (type === BrandingOverlayType.Branding11) {
        return (
          <CredentialCard12
            displayItems={displayItems}
            error={!existsInWallet}
            style={{ backgroundColor: ColorPallet.brand.secondaryBackground }}
            predicateError={!satisfiedPredicates}
            credName={credName}
            credDefId={credDefId}
            schemaId={schemaId}
            credential={credential as CredentialExchangeRecord}
            handleAltCredChange={handleAltCredChange}
            hasAltCredentials={hasAltCredentials}
            proof
            elevated
          />
        )
      } else {
        return (
          <CredentialCard11
            displayItems={displayItems}
            style={{ backgroundColor: ColorPallet.brand.secondaryBackground }}
            error={!existsInWallet}
            predicateError={!satisfiedPredicates}
            credName={credName}
            credDefId={credDefId}
            schemaId={schemaId}
            credential={credential as CredentialExchangeRecord}
            handleAltCredChange={handleAltCredChange}
            hasAltCredentials={hasAltCredentials}
            proof
            elevated
          />
        )
      }
    }

    if (credential) {
      if (type === BrandingOverlayType.Branding01) {
        return <CredentialCard10 credential={credential as CredentialExchangeRecord} style={style} onPress={onPress} />
      } else if (type == BrandingOverlayType.Branding11) {
        return <CredentialCard12 credential={credential as CredentialExchangeRecord} style={style} onPress={onPress} />
      } else {
        return <CredentialCard11 credential={credential as CredentialExchangeRecord} style={style} onPress={onPress} />
      }
    } else {
      if (type === BrandingOverlayType.Branding11) {
        return (
          <CredentialCard12
            credDefId={credDefId}
            schemaId={schemaId}
            credName={credName}
            displayItems={displayItems}
            style={style}
            onPress={onPress}
          />
        )
      } else {
        return (
          <CredentialCard11
            credDefId={credDefId}
            schemaId={schemaId}
            credName={credName}
            displayItems={displayItems}
            style={style}
            onPress={onPress}
          />
        )
      }
    }
  }

  if (credential instanceof W3cCredentialRecord) {
    return <OpenIDCredentialCard credentialRecord={credential as W3cCredentialRecord} onPress={onPress} />
  } else {
    return getCredOverlayType(bundleResolver.getBrandingOverlayType())
  }
}

export default CredentialCard
