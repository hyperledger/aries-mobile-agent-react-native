import { CredentialExchangeRecord } from '@credo-ts/core'
import { useCredentialCardParams } from './credential-card-params'
import { useBranding } from './bundle-resolver'
import { CredentialOverlay } from '@hyperledger/aries-oca/build/legacy'
import { BrandingOverlay } from '@hyperledger/aries-oca'
import { useEffect, useState } from 'react'

export function useFlaggedAttributes(
  credential?: CredentialExchangeRecord,
  schemaId?: string,
  credDefId?: string,
  proof?: boolean,
  credName?: string
) {
  const [flaggedAttributes, setFlaggedAttributes] = useState<string[]>()
  const params = useCredentialCardParams(credential, schemaId, credDefId, proof, credName)
  const { overlay } = useBranding<CredentialOverlay<BrandingOverlay>>(params)

  useEffect(() => {
    setFlaggedAttributes(overlay.bundle?.captureBase.flaggedAttributes.map((attr: any) => attr.name))
  }, [overlay])

  return { flaggedAttributes }
}
