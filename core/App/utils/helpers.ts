import {
  Agent,
  ConnectionRecord,
  CredentialExchangeRecord,
  RequestedAttribute,
  RequestedPredicate,
  RetrievedCredentials,
  IndyCredentialInfo,
  IndyProofFormat,
} from '@aries-framework/core'
import {
  FormatDataMessagePayload,
  FormatRetrievedCredentialOptions,
} from '@aries-framework/core/build/modules/proofs/models/ProofServiceOptions'
import { useConnectionById } from '@aries-framework/react-hooks'
import { Buffer } from 'buffer'
import { parseUrl } from 'query-string'

import { Attribute, Predicate } from '../types/record'

export { parsedCredDefName } from './cred-def'
export { parsedSchema } from './schema'

/**
 * Generates a numerical hash based on a given string
 * @see https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
 * @param { string } s given string
 * @returns { number } numerical hash value
 */
export const hashCode = (s: string): number => {
  return s.split('').reduce((hash, char) => char.charCodeAt(0) + ((hash << 5) - hash), 0)
}

/**
 * Generates a pseudorandom number between 0 and 1 based on a seed
 * @see https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
 * @see https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
 * @param { number } seed any number
 * @returns { number } pseudorandom number between 0 and 1
 */
const mulberry32 = (seed: number) => {
  let t = (seed += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/**
 * Converts a numerical hash into a hexidecimal color string 
 * @see https://helderesteves.com/generating-random-colors-js/#Generating_random_dark_colors
 * @param { number } hash numerical hash value (generated by hashCode function above)
 * @returns { string } hexidecimal string eg. #32d3cc
 */
export const hashToRGBA = (hash: number) => {
  let color = '#'
  const colorRangeUpperBound = 256

  // once for r, g, b
  for (let i = 0; i < 3; i++) {
    // append a pseudorandom two-char hexidecimal value from the lower half of the color spectrum (to limit to darker colors)
    color += ('0' + Math.floor((mulberry32(hash + i) * colorRangeUpperBound) / 2).toString(16)).slice(-2)
  }

  return color
}

/**
 * @deprecated The function should not be used
 */
export function connectionRecordFromId(connectionId?: string): ConnectionRecord | void {
  if (connectionId) {
    return useConnectionById(connectionId)
  }
}

/**
 * @deprecated The function should not be used
 */
export function getConnectionName(connection: ConnectionRecord | void): string | void {
  if (!connection) {
    return
  }
  return connection?.alias || connection?.theirLabel
}

export function getCredentialConnectionLabel(credential?: CredentialExchangeRecord) {
  if (!credential) {
    return ''
  }

  return credential?.connectionId
    ? useConnectionById(credential.connectionId)?.theirLabel
    : credential?.connectionId ?? ''
}

export function firstValidCredential(
  fields: RequestedAttribute[] | RequestedPredicate[],
  revoked = true
): RequestedAttribute | RequestedPredicate | null {
  if (!fields.length) {
    return null
  }

  let first = null
  const firstNonRevoked = fields.filter((field) => !field.revoked)[0]
  if (firstNonRevoked) {
    first = firstNonRevoked
  } else if (fields.length && revoked) {
    first = fields[0]
  }

  if (!first?.credentialInfo) {
    return null
  }

  return first
}

export const getOobDeepLink = async (url: string, agent: Agent | undefined): Promise<any> => {
  const queryParams = parseUrl(url).query
  const b64Message = queryParams['d_m'] ?? queryParams['c_i']
  const rawmessage = Buffer.from(b64Message as string, 'base64').toString()
  const message = JSON.parse(rawmessage)
  await agent?.receiveMessage(message)
  return message
}

/**
 * A sorting function for the Array `sort()` function
 * @param a First retrieved credential
 * @param b Second retrieved credential
 */
export const credentialSortFn = (a: any, b: any) => {
  if (a.revoked && !b.revoked) {
    return 1
  } else if (!a.revoked && b.revoked) {
    return -1
  } else {
    return b.timestamp - a.timestamp
  }
}

export const processProofAttributes = (
  request?: FormatDataMessagePayload<[IndyProofFormat], 'request'> | undefined,
  credentials?: FormatRetrievedCredentialOptions<[IndyProofFormat]>
): Attribute[] => {
  const processedAttributes = [] as Attribute[]

  if (!(request?.indy?.requested_attributes && credentials?.proofFormats?.indy?.requestedAttributes)) {
    return processedAttributes
  }

  const requestedProofAttributes = request.indy.requested_attributes
  const retrievedCredentialAttributes = credentials.proofFormats.indy.requestedAttributes

  for (const key of Object.keys(retrievedCredentialAttributes)) {
    // The shift operation modifies the original input array, therefore make a copy
    const credential = [...(retrievedCredentialAttributes[key] ?? [])].sort(credentialSortFn).shift()

    if (!credential) {
      return processedAttributes
    }

    const { credentialId, revoked, credentialInfo } = credential
    const { name, names } = requestedProofAttributes[key]

    for (const attributeName of [...(names ?? (name && [name]) ?? [])]) {
      const attributeValue = (credentialInfo as IndyCredentialInfo).attributes[attributeName]
      processedAttributes.push({
        credentialId,
        revoked,
        name: attributeName,
        value: attributeValue,
      })
    }
  }

  return processedAttributes
}

export const processProofPredicates = (
  request?: FormatDataMessagePayload<[IndyProofFormat], 'request'> | undefined,
  credentials?: FormatRetrievedCredentialOptions<[IndyProofFormat]>
): Predicate[] => {
  const processedPredicates = [] as Predicate[]

  if (!(request?.indy?.requested_predicates && credentials?.proofFormats?.indy?.requestedPredicates)) {
    return processedPredicates
  }

  const requestedProofPredicates = request.indy.requested_predicates
  const retrievedCredentialPredicates = credentials.proofFormats.indy.requestedPredicates

  for (const key of Object.keys(requestedProofPredicates)) {
    // The shift operation modifies the original input array, therefore make a copy
    const credential = [...(retrievedCredentialPredicates[key] ?? [])].sort(credentialSortFn).shift()

    if (!credential) {
      return processedPredicates
    }

    const { credentialId, revoked } = credential
    const { name, p_type: pType, p_value: pValue } = requestedProofPredicates[key]

    processedPredicates.push({
      credentialId,
      name,
      revoked,
      pValue,
      pType,
    })
  }

  return processedPredicates
}

/**
 * @deprecated The function should not be used
 */
export const sortCredentialsForAutoSelect = (credentials: RetrievedCredentials): RetrievedCredentials => {
  const requestedAttributes = Object.values(credentials?.requestedAttributes).pop()
  const requestedPredicates = Object.values(credentials?.requestedPredicates).pop()
  const sortFn = (a: any, b: any) => {
    if (a.revoked && !b.revoked) {
      return 1
    } else if (!a.revoked && b.revoked) {
      return -1
    } else {
      return b.timestamp - a.timestamp
    }
  }

  requestedAttributes && requestedAttributes.sort(sortFn)
  requestedPredicates && requestedPredicates.sort(sortFn)

  return credentials
}

/**
 *
 * @param url a redirection URL to retrieve a payload for an invite
 * @param agent an Agent instance
 * @returns payload from following the redirection
 */
export const receiveMessageFromUrlRedirect = async (url: string, agent: Agent | undefined) => {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  })
  const message = await res.json()
  await agent?.receiveMessage(message)
  return message
}

/**
 *
 * @param url a redirection URL to retrieve a payload for an invite
 * @param agent an Agent instance
 * @returns payload from following the redirection
 */
export const receiveMessageFromDeepLink = async (url: string, agent: Agent | undefined) => {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  })
  const message = await res.json()
  await agent?.receiveMessage(message)
  return message
}

/**
 *
 * @param uri a URI containing a base64 encoded connection invite in the query parameter
 * @param agent an Agent instance
 * @returns a connection record from parsing and receiving the invitation
 */
export const connectFromInvitation = async (uri: string, agent: Agent | undefined) => {
  const invitation = await agent?.oob.parseInvitation(uri)

  if (!invitation) {
    throw new Error('Could not parse invitation from URL')
  }

  const record = await agent?.oob.receiveInvitation(invitation)
  const connectionRecord = record?.connectionRecord
  if (!connectionRecord?.id) {
    throw new Error('Connection does not have an ID')
  }

  return connectionRecord
}
