import React from 'react'
import { FlatList, View } from 'react-native'
import { ProofCredentialItems } from '../../types/proof-items'
import { CredentialErrors } from '../../components/misc/CredentialCard11'
import { CredentialCard } from '../../components/misc'
import { Fields } from '../../utils/helpers'
import { Attribute, Predicate } from '@hyperledger/aries-oca/build/legacy'

type ProofRequestCredentialListProps = {
  header?: JSX.Element
  footer?: JSX.Element
  items: ProofCredentialItems[]
  missing?: boolean
  loading?: boolean
  attestationLoading?: boolean
  hasSatisfiedPredicates?: (fields: Fields, credId?: string) => boolean
  getCredentialsFields?: () => Fields
  displayItems?: (item: ProofCredentialItems) => (Attribute | Predicate)[]
  handleAltCredChange?: (item: ProofCredentialItems) => void
}

const ProofRequestCredentialList: React.FC<ProofRequestCredentialListProps> = ({
  header,
  footer,
  items,
  missing,
  loading,
  attestationLoading,
  hasSatisfiedPredicates,
  getCredentialsFields,
  displayItems,
  handleAltCredChange,
}: ProofRequestCredentialListProps) => {
  return (
    <FlatList
      data={items}
      scrollEnabled={false}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      renderItem={({ item }) => {
        const errors: CredentialErrors[] = []
        missing && errors.push(CredentialErrors.NotInWallet)
        item.credExchangeRecord?.revocationNotification?.revocationDate && errors.push(CredentialErrors.Revoked)
        !(getCredentialsFields && hasSatisfiedPredicates?.(getCredentialsFields(), item.credId)) &&
          errors.push(CredentialErrors.PredicateError)
        return (
          <View>
            {loading || attestationLoading ? null : (
              <View style={{ marginTop: 10, marginHorizontal: 20 }}>
                <CredentialCard
                  credential={item.credExchangeRecord}
                  credDefId={item.credDefId}
                  schemaId={item.schemaId}
                  displayItems={displayItems?.(item)}
                  credName={item.credName}
                  hasAltCredentials={item.altCredentials && item.altCredentials.length > 1}
                  handleAltCredChange={() => {
                    handleAltCredChange?.(item)
                  }}
                  proof
                  credentialErrors={errors}
                />
              </View>
            )}
          </View>
        )
      }}
    />
  )
}

export default ProofRequestCredentialList
