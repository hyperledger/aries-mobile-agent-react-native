import { CredentialExchangeRecord } from '@credo-ts/core'
import { useEffect, useState } from 'react'

export function useCredentialRevoked(credential?: CredentialExchangeRecord, proof?: boolean) {
  const [isRevoked, setIsRevoked] = useState<boolean>(credential?.revocationNotification !== undefined)

  useEffect(() => {
    setIsRevoked(credential?.revocationNotification !== undefined && !proof)
  }, [credential, proof])

  return { isRevoked }
}
