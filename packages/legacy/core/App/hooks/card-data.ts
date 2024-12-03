import { useMemo } from 'react'
import { useBranding } from './bundle-resolver'
import { Attribute, CredentialOverlay, Predicate } from '@hyperledger/aries-oca/build/legacy'
import { BrandingOverlay } from '@hyperledger/aries-oca'
import { CredentialExchangeRecord } from '@credo-ts/core'
import { useCredentialCardParams } from './credential-card-params'

export function useCardData(
  credential?: CredentialExchangeRecord,
  schemaId?: string,
  credDefId?: string,
  proof?: boolean,
  credName?: string,
  displayItems?: (Attribute | Predicate)[]
) {
  const params = useCredentialCardParams(credential, schemaId, credDefId, proof, credName)
  const { overlay } = useBranding<CredentialOverlay<BrandingOverlay>>(params)
  return useMemo(() => {
    const primaryField = overlay?.presentationFields?.find(
      (field) => field.name === overlay?.brandingOverlay?.primaryAttribute
    )
    const secondaryField = overlay?.presentationFields?.find(
      (field) => field.name === overlay?.brandingOverlay?.secondaryAttribute
    )

    return [...(displayItems ?? []), primaryField, secondaryField]
  }, [displayItems, overlay])
}
