import { useEffect, useState } from 'react'
import { useCardData } from './card-data'
import { CredentialExchangeRecord } from '@credo-ts/core'
import { Attribute, Predicate } from '@hyperledger/aries-oca/build/legacy'
import { useParseAttribute } from './parse-attribute'
import { useFlaggedAttributes } from './flagged-attributes'

export function useCredentialPI(
  credential?: CredentialExchangeRecord,
  schemaId?: string,
  credDefId?: string,
  proof?: boolean,
  credName?: string,
  displayItems?: (Attribute | Predicate)[]
) {
  const [allPI, setAllPI] = useState<boolean>()
  const { flaggedAttributes } = useFlaggedAttributes(credential, schemaId, credDefId, proof, credName)
  const cardData = useCardData(credential, schemaId, credDefId, proof, credName, displayItems)
  const parseAttribute = useParseAttribute(credential, schemaId, credDefId, proof, credName)
  useEffect(() => {
    setAllPI(
      credential &&
        cardData.every((item) => {
          if (item === undefined) {
            return true
          } else if (item instanceof Attribute) {
            const { label } = parseAttribute(item as Attribute & Predicate)
            return flaggedAttributes?.includes(label)
          } else {
            // Predicates are not PII
            return false
          }
        })
    )
  }, [credential, flaggedAttributes, cardData, parseAttribute])
  return { allPI }
}
