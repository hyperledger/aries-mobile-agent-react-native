import { CredentialExchangeRecord } from '@credo-ts/core'
import { useMemo } from 'react'
import { getCredentialIdentifiers } from '../utils/credential'
import { useCredentialConnectionLabel } from '../utils/helpers'
import { useTranslation } from 'react-i18next'

export function useCredentialCardParams(
  credential?: CredentialExchangeRecord,
  schemaId?: string,
  credDefId?: string,
  proof?: boolean,
  credName?: string
) {
  const credentialConnectionLabel = useCredentialConnectionLabel(credential)
  const { i18n } = useTranslation()
  return useMemo(
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
}
