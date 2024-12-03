import { Attribute, CredentialOverlay, Predicate } from '@hyperledger/aries-oca/build/legacy'
import { useCallback } from 'react'
import { formatIfDate, pTypeToText } from '../utils/helpers'
import { useBranding } from './bundle-resolver'
import { CredentialExchangeRecord } from '@credo-ts/core'
import { useTranslation } from 'react-i18next'
import { BrandingOverlay } from '@hyperledger/aries-oca'
import { useAttributeFormats } from './attribute-formats'
import { useCredentialCardParams } from './credential-card-params'

export function useParseAttribute(
  credential?: CredentialExchangeRecord,
  schemaId?: string,
  credDefId?: string,
  proof?: boolean,
  credName?: string
) {
  const { t } = useTranslation()
  const attributeFormats = useAttributeFormats(credential, schemaId, credDefId, proof, credName)

  const params = useCredentialCardParams(credential, schemaId, credDefId, proof, credName)

  const { overlay } = useBranding<CredentialOverlay<BrandingOverlay>>(params)

  return useCallback(
    (item: (Attribute & Predicate) | undefined) => {
      let parsedItem = item
      if (item && item.pValue != null) {
        parsedItem = pTypeToText(item, t, overlay.bundle?.captureBase.attributes) as Attribute & Predicate
      }
      const parsedValue = formatIfDate(
        attributeFormats?.[item?.name ?? ''],
        parsedItem?.value ?? parsedItem?.pValue ?? null
      )
      return {
        label: item?.label ?? item?.name ?? '',
        value: item?.value !== undefined && item?.value != null ? parsedValue : `${parsedItem?.pType} ${parsedValue}`,
      }
    },
    [t, overlay, attributeFormats]
  )
}
