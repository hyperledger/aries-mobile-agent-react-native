import { CredentialExchangeRecord } from '@credo-ts/core'
import { useEffect, useState } from 'react'

export function useProofRevoked(credential?: CredentialExchangeRecord, proof?: boolean) {
  const [isProofRevoked, setIsProofRevoked] = useState<boolean>(
    credential?.revocationNotification !== undefined && !!proof
  )

  useEffect(() => {
    setIsProofRevoked(credential?.revocationNotification !== undefined && !!proof)
  }, [credential, proof])

  return { isProofRevoked }
}
