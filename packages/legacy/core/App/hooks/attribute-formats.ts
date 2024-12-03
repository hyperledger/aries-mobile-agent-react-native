import { useMemo } from 'react'
import { useBranding } from './bundle-resolver'
import { CredentialExchangeRecord } from '@credo-ts/core'
import { getCredentialIdentifiers } from '../utils/credential'
import { useCredentialConnectionLabel } from '../utils/helpers'
import { useTranslation } from 'react-i18next'
import { CredentialOverlay } from '@hyperledger/aries-oca/build/legacy'
import { BrandingOverlay } from '@hyperledger/aries-oca'

export function useAttributeFormats(
  credential?: CredentialExchangeRecord,
  schemaId?: string,
  credDefId?: string,
  proof?: boolean,
  credName?: string
): Record<string, string | undefined> {
  const { i18n } = useTranslation()
  const credentialConnectionLabel = useCredentialConnectionLabel(credential)
  const params = useMemo(
    () => ({
      identifiers: credential ? getCredentialIdentifiers(credential) : { schemaId, credentialDefinitionId: credDefId },
      attributes: proof ? [] : credential?.credentialAttributes,
      meta: {
        credName,
        credConnectionId: credential?.connectionId,
        alias: credentialConnectionLabel,
      },
      language: i18n.language,
    }),
    [credential, credName, schemaId, credDefId, proof, credentialConnectionLabel, i18n.language]
  )
  const { overlay } = useBranding<CredentialOverlay<BrandingOverlay>>(params)
  return useMemo(() => {
    return (overlay.bundle as any)?.bundle.attributes
      .map((attr: any) => {
        return { name: attr.name, format: attr.format }
      })
      .reduce((prev: { [key: string]: string }, curr: { name: string; format?: string }) => {
        return { ...prev, [curr.name]: curr.format }
      }, {})
  }, [overlay])
}
