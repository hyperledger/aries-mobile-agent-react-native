import {
  AnonCredsCredentialInfo,
  AnonCredsCredentialsForProofRequest,
  AnonCredsPredicateType,
  AnonCredsProofFormatService,
  AnonCredsProofRequest,
  AnonCredsProofRequestRestriction,
  AnonCredsRequestedAttribute,
  AnonCredsRequestedAttributeMatch,
  AnonCredsRequestedPredicate,
  AnonCredsRequestedPredicateMatch,
} from '@credo-ts/anoncreds'
import {
  Agent,
  BasicMessageRecord,
  ConnectionRecord,
  CredentialExchangeRecord,
  CredentialState,
  HandshakeProtocol,
  ProofExchangeRecord,
  ProofState,
  parseDid,
} from '@credo-ts/core'
import { BasicMessageRole } from '@credo-ts/core/build/modules/basic-messages/BasicMessageRole'
import { useConnectionById } from '@credo-ts/react-hooks'
import { CaptureBaseAttributeType } from '@hyperledger/aries-oca'
import { Attribute, Predicate } from '@hyperledger/aries-oca/build/legacy'
import { Buffer } from 'buffer'
import moment from 'moment'
import { ParsedUrl, parseUrl } from 'query-string'
import { ReactNode } from 'react'
import { TFunction } from 'react-i18next'
import { DeviceEventEmitter } from 'react-native'

import { EventTypes, domain } from '../constants'
import { i18n } from '../localization/index'
import { Role } from '../types/chat'
import { BifoldError } from '../types/error'
import { ProofCredentialAttributes, ProofCredentialItems, ProofCredentialPredicates } from '../types/proof-items'
import { ChildFn } from '../types/tour'

import { BifoldAgent } from './agent'
import { createAnonCredsProofRequest, getDescriptorMetadata } from './anonCredsProofRequestMapper'
import { parseCredDefFromId } from './cred-def'

export { parsedCredDefNameFromCredential } from './cred-def'

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
 *
 * @param time
 * @param params see below
 * shortMonth: whether to use Jun in place of June, Mar in place of March for example (overridden by `format`)
 * format: an optional custom moment format string to create the formatted date from
 * includeHour: whether to add the hour and minute and am/pm. eg 9:32 pm (overridden by `chatFormat` and `trim`)
 * chatFormat: whether to style the date to appear like a chat message timestamp eg. '7 minutes ago' or 'Just now'
 * trim: if true, if it's the same day the date will be trimmed to just the hour, if it's the same year then the year will be trimmed from the date
 * eg. if the current year is 2023, February 12, 2023 will be trimmed to February 12
 * @returns formatted time string
 */
export function formatTime(
  time: Date,
  params?: { shortMonth?: boolean; format?: string; includeHour?: boolean; chatFormat?: boolean; trim?: boolean }
): string {
  const getMonthKey = 'MMMM'
  const momentTime = moment(time)
  const monthKey = momentTime.format(getMonthKey)
  const customMonthFormatRe = /M+/
  const shortMonth = params?.shortMonth
  const format = params?.format
  const includeHour = params?.includeHour
  const chatFormat = params?.chatFormat
  const trim = params?.trim
  const shortDateFormatMaskLength = 3
  const millisecondsAgo = moment().diff(momentTime)
  const lessThanAMinuteAgo = millisecondsAgo / 1000 / 60 < 1
  const lessThanAnHourAgo = millisecondsAgo / 1000 / 60 / 60 < 1
  const now = new Date()
  const sameYear = time.getFullYear() === now.getFullYear()
  const sameDay = time.getDate() === now.getDate() && time.getMonth() === now.getMonth() && sameYear
  const isPortuguese = i18n.resolvedLanguage === 'pt-BR'
  const isNonEnglish = i18n.resolvedLanguage === 'fr' || isPortuguese
  const hoursFormat = isPortuguese ? 'HH:mm' : 'h:mm a'
  // for the shortened approach eg. in chat bubbles
  if (chatFormat) {
    if (lessThanAMinuteAgo) {
      return i18n.t('Date.JustNow')
    }
    if (lessThanAnHourAgo) {
      const minutesAgo = Math.floor(millisecondsAgo / 1000 / 60)
      return minutesAgo === 1 ? `1 ${i18n.t('Date.MinuteAgo')}` : `${minutesAgo} ${i18n.t('Date.MinutesAgo')}`
    }
    if (sameDay) {
      return momentTime.format(hoursFormat)
    }
  }

  let formatString = i18n.t('Date.ShortFormat')
  let formattedTime = ''
  // if sameDay and abbreviated
  if (sameDay && trim) {
    return momentTime.format(hoursFormat)
  }

  if (format) {
    formatString = format
    formattedTime = momentTime.format(format)
  } else {
    if (!shortMonth) {
      formatString = i18n.t('Date.LongFormat')
    }

    // if translation fails
    if (formatString === 'Date.ShortFormat' || formatString === 'Date.LongFormat' || formatString === undefined) {
      formatString = 'MMM D'
    }

    // if trim is true, don't include the year for same year times
    formattedTime =
      trim && sameYear
        ? momentTime.format(formatString)
        : // if non-english, don't include comma between year and month
        isNonEnglish
        ? `${momentTime.format(formatString)} ${momentTime.format('YYYY')}`
        : `${momentTime.format(formatString)}, ${momentTime.format('YYYY')}`
    if (includeHour) {
      formattedTime = `${formattedTime}, ${momentTime.format(hoursFormat)}`
    }
  }

  const customMonthFormat = formatString?.match(customMonthFormatRe)?.[0]

  if (customMonthFormat) {
    let monthReplacement = ''
    const monthReplacementKey = momentTime.format(customMonthFormat)
    if (customMonthFormat.length === shortDateFormatMaskLength) {
      // then we know we're dealing with a short date format: 'MMM'
      monthReplacement = i18n.t(`Date.MonthShort.${monthKey}`)
    } else if (customMonthFormat.length > shortDateFormatMaskLength) {
      // then we know we're working with a long date format: 'MMMM'
      monthReplacement = i18n.t(`Date.MonthLong.${monthKey}`)
    }
    // if translation doesn't work
    if (monthReplacement === `Date.MonthLong.${monthKey}` || monthReplacement === `Date.MonthShort.${monthKey}`) {
      monthReplacement = monthReplacementKey
    }

    if (monthReplacement) {
      formattedTime = formattedTime.replace(monthReplacementKey, monthReplacement)
    }
  }
  return formattedTime
}

export function formatIfDate(format: string | undefined, value: string | number | null) {
  const potentialDate = value ? value.toString() : null
  if (format === 'YYYYMMDD' && potentialDate && potentialDate.length === format.length) {
    const year = potentialDate.substring(0, 4)
    const month = potentialDate.substring(4, 6)
    const day = potentialDate.substring(6, 8)
    // NOTE: JavaScript counts months from 0 to 11: January = 0, December = 11.
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    if (!isNaN(date.getDate())) {
      return formatTime(date, { shortMonth: true })
    }
  }
  return value
}

/**
 * @deprecated The function should not be used
 */
export function connectionRecordFromId(connectionId?: string): ConnectionRecord | void {
  if (connectionId) {
    return useConnectionById(connectionId)
  }
}

export function getConnectionName(
  connection: ConnectionRecord | undefined,
  alternateContactNames: Record<string, string>
): string {
  return (
    (connection?.id && alternateContactNames[connection?.id]) ||
    connection?.theirLabel ||
    connection?.alias ||
    connection?.id ||
    ''
  )
}

export function getCredentialConnectionLabel(credential?: CredentialExchangeRecord) {
  if (!credential) {
    return ''
  }

  if (credential.connectionId) {
    const connection = useConnectionById(credential.connectionId)
    return connection?.alias || connection?.theirLabel || credential.connectionId
  }

  return 'Unknown Contact'
}

export function getConnectionImageUrl(connectionId: string) {
  const connection = useConnectionById(connectionId)
  if (!connection) {
    return undefined
  }
  return connection.imageUrl ?? undefined
}

export function firstValidCredential(
  fields: AnonCredsRequestedAttributeMatch[] | AnonCredsRequestedPredicateMatch[],
  revoked = true
): AnonCredsRequestedAttributeMatch | AnonCredsRequestedPredicateMatch | null {
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

const credNameFromRestriction = (queries?: AnonCredsProofRequestRestriction[]): string => {
  let schema_name = ''
  let cred_def_id = ''
  let schema_id = ''
  queries?.forEach((query) => {
    schema_name = (query?.schema_name as string) ?? schema_name
    cred_def_id = (query?.cred_def_id as string) ?? cred_def_id
    schema_id = (query?.schema_id as string) ?? schema_id
  })
  if (schema_name && (schema_name.toLowerCase() !== 'default' || schema_name.toLowerCase() !== 'credential')) {
    return schema_name
  } else {
    return parseCredDefFromId(cred_def_id, schema_id)
  }
}

export const credDefIdFromRestrictions = (queries?: AnonCredsProofRequestRestriction[]): string => {
  return queries?.filter((rstr) => rstr.cred_def_id)[0]?.cred_def_id ?? ''
}

export const schemaIdFromRestrictions = (queries?: AnonCredsProofRequestRestriction[]): string => {
  const rstrWithSchemaId = queries?.filter(
    (rstr) => rstr.schema_id || (rstr.issuer_did && rstr.schema_name && rstr.schema_version)
  )[0]

  // the '2' here is the enum of the transaction type which, for schemas, is always 2
  const schemaId = rstrWithSchemaId
    ? rstrWithSchemaId.schema_id ||
      `${rstrWithSchemaId.issuer_did}:2:${rstrWithSchemaId.schema_name}:${rstrWithSchemaId.schema_version}`
    : ''
  return schemaId
}

export const isDataUrl = (value: string | number | null) => {
  return typeof value === 'string' && value.startsWith('data:image/')
}
export type Fields = Record<string, AnonCredsRequestedAttributeMatch[] | AnonCredsRequestedPredicateMatch[]>

/**
 * Retrieve current credentials info filtered by `credentialDefinitionId` if given.
 * @param credDefId Credential Definition Id
 * @returns Array of `AnonCredsCredentialInfo`
 */
export const getCredentialInfo = (credId: string, fields: Fields): AnonCredsCredentialInfo[] => {
  const credentialInfo: AnonCredsCredentialInfo[] = []

  Object.keys(fields).forEach((proofKey) => {
    credentialInfo.push(...fields[proofKey].map((attr) => attr.credentialInfo))
  })

  return !credId ? credentialInfo : credentialInfo.filter((cred) => cred.credentialId === credId)
}

/**
 * Evaluate if given attribute value satisfies the predicate.
 * @param attribute Credential attribute value
 * @param pValue Predicate value
 * @param pType Predicate type ({@link AnonCredsPredicateType})
 * @returns `true`if predicate is satisfied, otherwise `false`
 */
const evaluateOperation = (attribute: number, pValue: number, pType: AnonCredsPredicateType): boolean => {
  if (pType === '>=') {
    return attribute >= pValue
  }

  if (pType === '>') {
    return attribute > pValue
  }

  if (pType === '<=') {
    return attribute <= pValue
  }
  if (pType === '<') {
    return attribute < pValue
  }

  return false
}

/**
 * Given proof credential items, evaluate and return its predicates, setting `satisfied` property.
 * @param proofCredentialsItems
 * @returns Array of evaluated predicates
 */
export const evaluatePredicates =
  (fields: Fields, credId?: string) =>
  (proofCredentialItems: ProofCredentialItems): Predicate[] => {
    const predicates = proofCredentialItems.predicates
    if (!predicates || predicates.length == 0) {
      return []
    }

    if ((credId && credId != proofCredentialItems.credId) || !proofCredentialItems.credId) {
      return []
    }

    const credentialAttributes = getCredentialInfo(proofCredentialItems.credId, fields).map((ci) => ci.attributes)

    return predicates.map((predicate: Predicate) => {
      const { pType: pType, pValue: pValue, name: field } = predicate
      let satisfied = false

      if (field) {
        const attribute = (credentialAttributes.find((attr) => attr[field] != undefined) ?? {})[field]

        if (attribute && pValue) {
          satisfied = evaluateOperation(Number(attribute), Number(pValue), pType as AnonCredsPredicateType)
        }
      }

      return { ...predicate, satisfied }
    })
  }

const addMissingDisplayAttributes = (attrReq: AnonCredsRequestedAttribute) => {
  const { name, names, restrictions } = attrReq
  const credName = credNameFromRestriction(restrictions)
  const proofCredDefId = credDefIdFromRestrictions(restrictions)
  const proofSchemaId = schemaIdFromRestrictions(restrictions)

  //there is no credId in this context so use credName as a placeholder
  const processedAttributes: ProofCredentialAttributes = {
    credExchangeRecord: undefined,
    altCredentials: [credName],
    credId: credName,
    schemaId: undefined,
    credDefId: undefined,
    credName: credName,
    proofCredDefId,
    proofSchemaId,
    attributes: [] as Attribute[],
  }

  for (const attributeName of [...(names ?? (name && [name]) ?? [])]) {
    processedAttributes.attributes?.push(
      new Attribute({
        revoked: false,
        credentialId: credName,
        name: attributeName,
        value: '',
      })
    )
  }
  return processedAttributes
}
export const processProofAttributes = (
  request?: AnonCredsProofRequest,
  credentials?: AnonCredsCredentialsForProofRequest,
  credentialRecords?: CredentialExchangeRecord[]
): { [key: string]: ProofCredentialAttributes } => {
  const processedAttributes = {} as { [key: string]: ProofCredentialAttributes }

  const requestedProofAttributes = request?.requested_attributes
  const retrievedCredentialAttributes = credentials?.attributes
  const requestNonRevoked = request?.non_revoked // non_revoked interval can sometimes be top level

  if (!requestedProofAttributes || !retrievedCredentialAttributes) {
    return {}
  }
  for (const key of Object.keys(retrievedCredentialAttributes)) {
    const altCredentials = [...(retrievedCredentialAttributes[key] ?? [])]
      .sort(credentialSortFn)
      .map((cred) => cred.credentialId)

    const credentialList = [...(retrievedCredentialAttributes[key] ?? [])].sort(credentialSortFn)

    const { name, names, non_revoked, restrictions } = requestedProofAttributes[key]

    const proofCredDefId = credDefIdFromRestrictions(restrictions)
    const proofSchemaId = schemaIdFromRestrictions(restrictions)

    if (credentialList.length <= 0) {
      const missingAttributes = addMissingDisplayAttributes(requestedProofAttributes[key])
      if (!processedAttributes[missingAttributes.credName]) {
        processedAttributes[missingAttributes.credName] = missingAttributes
      } else {
        processedAttributes[missingAttributes.credName].attributes?.push(...(missingAttributes.attributes ?? []))
      }
    }

    //iterate over all credentials that satisfy the proof
    for (const credential of credentialList) {
      let credName = key
      if (credential?.credentialInfo?.credentialDefinitionId || credential?.credentialInfo?.schemaId) {
        credName = parseCredDefFromId(
          credential?.credentialInfo?.credentialDefinitionId,
          credential?.credentialInfo?.schemaId
        )
      }
      let revoked = false
      let credExchangeRecord = undefined
      if (credential) {
        credExchangeRecord = credentialRecords?.find((record) =>
          record.credentials.map((cred) => cred.credentialRecordId).includes(credential.credentialId)
        )
        revoked = credExchangeRecord?.revocationNotification !== undefined
      } else {
        continue
      }
      for (const attributeName of [...(names ?? (name && [name]) ?? [])]) {
        if (!processedAttributes[credential?.credentialId]) {
          // init processedAttributes object
          processedAttributes[credential.credentialId] = {
            credExchangeRecord,
            altCredentials,
            credId: credential?.credentialId,
            schemaId: credential?.credentialInfo?.schemaId,
            credDefId: credential?.credentialInfo?.credentialDefinitionId,
            proofCredDefId,
            proofSchemaId,
            credName,
            attributes: [],
          }
        }

        const attributeValue = credential ? credential.credentialInfo.attributes[attributeName] : null
        processedAttributes[credential.credentialId].attributes?.push(
          new Attribute({
            ...requestedProofAttributes[key],
            revoked,
            credentialId: credential.credentialId,
            name: attributeName,
            value: attributeValue,
            nonRevoked: requestNonRevoked ?? non_revoked,
          })
        )
      }
    }
  }
  return processedAttributes
}

export const mergeAttributesAndPredicates = (
  attributes: { [key: string]: ProofCredentialAttributes },
  predicates: { [key: string]: ProofCredentialPredicates }
) => {
  const merged: { [key: string]: ProofCredentialAttributes & ProofCredentialPredicates } = { ...attributes }
  for (const [key, predicate] of Object.entries(predicates)) {
    const existingEntry = merged[key]
    if (existingEntry) {
      const mergedAltCreds = existingEntry.altCredentials?.filter((credId: string) =>
        predicate.altCredentials?.includes(credId)
      )
      merged[key] = { ...existingEntry, ...predicate }
      merged[key].altCredentials = mergedAltCreds
    } else {
      merged[key] = predicate
    }
  }
  return merged
}

const addMissingDisplayPredicates = (predReq: AnonCredsRequestedPredicate) => {
  const { name, p_type: pType, p_value: pValue, restrictions } = predReq

  const credName = credNameFromRestriction(restrictions)
  const proofCredDefId = credDefIdFromRestrictions(restrictions)
  const proofSchemaId = schemaIdFromRestrictions(restrictions)

  //there is no credId in this context so use credName as a placeholder
  const processedPredicates: ProofCredentialPredicates = {
    credExchangeRecord: undefined,
    altCredentials: [credName],
    credId: credName,
    schemaId: undefined,
    credDefId: undefined,
    proofCredDefId,
    proofSchemaId,
    credName: credName,
    predicates: [] as Predicate[],
  }

  processedPredicates.predicates?.push(
    new Predicate({
      revoked: false,
      credentialId: credName,
      name: name,
      pValue,
      pType,
    })
  )
  return processedPredicates
}
export const processProofPredicates = (
  request?: AnonCredsProofRequest,
  credentials?: AnonCredsCredentialsForProofRequest,
  credentialRecords?: CredentialExchangeRecord[]
): { [key: string]: ProofCredentialPredicates } => {
  const processedPredicates = {} as { [key: string]: ProofCredentialPredicates }
  const requestedProofPredicates = request?.requested_predicates
  const retrievedCredentialPredicates = credentials?.predicates
  const requestNonRevoked = request?.non_revoked // // non_revoked interval can sometimes be top level

  if (!requestedProofPredicates || !retrievedCredentialPredicates) {
    return {}
  }

  for (const key of Object.keys(retrievedCredentialPredicates)) {
    const altCredentials = [...(retrievedCredentialPredicates[key] ?? [])]
      .sort(credentialSortFn)
      .map((cred) => cred.credentialId)

    const credentialList = [...(retrievedCredentialPredicates[key] ?? [])].sort(credentialSortFn)
    const { name, p_type: pType, p_value: pValue, non_revoked, restrictions } = requestedProofPredicates[key]
    const proofCredDefId = credDefIdFromRestrictions(restrictions)
    const proofSchemaId = schemaIdFromRestrictions(restrictions)

    if (credentialList.length <= 0) {
      const missingPredicates = addMissingDisplayPredicates(requestedProofPredicates[key])
      if (!processedPredicates[missingPredicates.credName]) {
        processedPredicates[missingPredicates.credName] = missingPredicates
      } else {
        processedPredicates[missingPredicates.credName].predicates?.push(...(missingPredicates.predicates ?? []))
      }
    }

    for (const credential of credentialList) {
      let revoked = false
      let credExchangeRecord = undefined
      if (credential) {
        credExchangeRecord = credentialRecords?.find((record) =>
          record.credentials.map((cred) => cred.credentialRecordId).includes(credential.credentialId)
        )
        revoked = credExchangeRecord?.revocationNotification !== undefined
      } else {
        continue
      }
      const { credentialDefinitionId, schemaId } = { ...credential, ...credential?.credentialInfo }

      const credNameRestriction = credNameFromRestriction(requestedProofPredicates[key]?.restrictions)

      let credName = credNameRestriction ?? key
      if (credential?.credentialInfo?.credentialDefinitionId || credential?.credentialInfo?.schemaId) {
        credName = parseCredDefFromId(
          credential?.credentialInfo?.credentialDefinitionId,
          credential?.credentialInfo?.schemaId
        )
      }

      if (!processedPredicates[credential.credentialId]) {
        processedPredicates[credential.credentialId] = {
          altCredentials,
          credExchangeRecord,
          credId: credential.credentialId,
          schemaId,
          credDefId: credentialDefinitionId,
          proofCredDefId,
          proofSchemaId,
          credName: credName,
          predicates: [],
        }
      }

      processedPredicates[credential.credentialId].predicates?.push(
        new Predicate({
          ...requestedProofPredicates[key],
          credentialId: credential?.credentialId,
          name,
          revoked,
          pValue,
          pType,
          nonRevoked: requestNonRevoked ?? non_revoked,
        })
      )
    }
  }
  return processedPredicates
}

export const retrieveCredentialsForProof = async (
  agent: BifoldAgent,
  proof: ProofExchangeRecord,
  fullCredentials: CredentialExchangeRecord[],
  t: TFunction<'translation', undefined>
) => {
  try {
    const format = await agent.proofs.getFormatData(proof.id)
    const hasPresentationExchange = format.request?.presentationExchange !== undefined
    const hasAnonCreds = format.request?.anoncreds !== undefined
    const hasIndy = format.request?.indy !== undefined
    const credentials = await agent.proofs.getCredentialsForRequest({
      proofRecordId: proof.id,
      proofFormats: {
        // FIXME: Credo will try to use the format, even if the value is undefined (but the key is present)
        // We should ignore the key, if the value is undefined. For now this is a workaround.
        ...(hasIndy
          ? {
              indy: {
                // Setting `filterByNonRevocationRequirements` to `false` returns all
                // credentials even if they are revokable (and revoked). We need this to
                // be able to show why a proof cannot be satisfied. Otherwise we can only
                // show failure.
                filterByNonRevocationRequirements: false,
              },
            }
          : {}),
        ...(hasAnonCreds
          ? {
              anoncreds: {
                // Setting `filterByNonRevocationRequirements` to `false` returns all
                // credentials even if they are revokable (and revoked). We need this to
                // be able to show why a proof cannot be satisfied. Otherwise we can only
                // show failure.
                filterByNonRevocationRequirements: false,
              },
            }
          : {}),
        ...(hasPresentationExchange ? { presentationExchange: {} } : {}),
      },
    })
    if (!credentials) {
      throw new Error(t('ProofRequest.RequestedCredentialsCouldNotBeFound'))
    }

    if (!format) {
      throw new Error(t('ProofRequest.RequestedCredentialsCouldNotBeFound'))
    }

    if (!(format && credentials && fullCredentials)) {
      return
    }

    if (hasPresentationExchange) {
      const presentationExchange = format.request?.presentationExchange
      const difPexCredentialsForRequest = credentials.proofFormats.presentationExchange

      if (!difPexCredentialsForRequest || !presentationExchange) throw new Error('Invalid presentation request')

      const presentationDefinition = presentationExchange.presentation_definition

      const descriptorMetadata = await getDescriptorMetadata(agent.context, difPexCredentialsForRequest)
      const anonCredsProofRequest = await createAnonCredsProofRequest(presentationDefinition, descriptorMetadata)
      const anonCredsProofFormatService = agent.dependencyManager.resolve(AnonCredsProofFormatService) as any
      // TODO:
      const anonCredsCredentialsForRequest: AnonCredsCredentialsForProofRequest =
        await anonCredsProofFormatService._getCredentialsForRequest(agent.context, anonCredsProofRequest, {
          filterByNonRevocationRequirements: false,
        })

      // The matches returned by our artificial anonCredsProofRequest could contain matches which are not valid thus we need to filter them out
      anonCredsCredentialsForRequest.attributes = Object.fromEntries(
        Object.entries(anonCredsCredentialsForRequest.attributes).map(([referent, matches]) => {
          const descriptorId = anonCredsProofRequest.requested_attributes[referent].descriptorId
          if (!descriptorId || !descriptorMetadata[descriptorId]) throw new Error('Could filter valid credentials')
          const descriptorMeta = descriptorMetadata[descriptorId]
          const validCredentialsForReferent = descriptorMeta.map((meta) => meta.record.id)
          const validMatches = matches.filter((match) => validCredentialsForReferent.includes(match.credentialId))
          return [referent, validMatches]
        })
      )

      anonCredsCredentialsForRequest.predicates = Object.fromEntries(
        Object.entries(anonCredsCredentialsForRequest.predicates).map(([referent, matches]) => {
          const descriptorId = anonCredsProofRequest.requested_predicates[referent].descriptorId
          if (!descriptorId || !descriptorMetadata[descriptorId]) throw new Error('Could filter valid credentials')
          const descriptorMeta = descriptorMetadata[descriptorId]
          const validCredentialsForReferent = descriptorMeta.map((meta) => meta.record.id)
          const validMatches = matches.filter((match) => validCredentialsForReferent.includes(match.credentialId))
          return [referent, validMatches]
        })
      )

      const processedAttributes = processProofAttributes(
        anonCredsProofRequest,
        anonCredsCredentialsForRequest,
        fullCredentials
      )

      const processedPredicates = processProofPredicates(
        anonCredsProofRequest,
        anonCredsCredentialsForRequest,
        fullCredentials
      )

      const groupedProof = Object.values(mergeAttributesAndPredicates(processedAttributes, processedPredicates))

      return {
        groupedProof,
        retrievedCredentials: anonCredsCredentialsForRequest,
        fullCredentials,
        descriptorMetadata,
      }
    }

    const proofRequest = format.request?.anoncreds ?? format.request?.indy
    const proofFormat = credentials.proofFormats.anoncreds ?? credentials.proofFormats.indy

    const attributes = processProofAttributes(proofRequest, proofFormat, fullCredentials)
    const predicates = processProofPredicates(proofRequest, proofFormat, fullCredentials)
    const groupedProof = Object.values(mergeAttributesAndPredicates(attributes, predicates))

    return { groupedProof, retrievedCredentials: proofFormat, fullCredentials }
  } catch (err: unknown) {
    const error = new BifoldError(t('Error.Title1043'), t('Error.Message1043'), (err as Error)?.message ?? err, 1043)
    DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
  }
}

export const pTypeToText = (
  item: Predicate,
  t: TFunction<'translation', undefined>,
  attributeTypes?: Record<string, string>
) => {
  const itemCopy = { ...item }
  const pTypeMap: { [key: string]: string | undefined } = {
    '>=': t('ProofRequest.PredicateGe'),
    '>': t('ProofRequest.PredicateGr'),
    '<=': t('ProofRequest.PredicateLe'),
    '<': t('ProofRequest.PredicateLs'),
  }
  const pTypeDateMap: { [key: string]: string | undefined } = {
    '>=': t('ProofRequest.PredicateGeDate'),
    '>': t('ProofRequest.PredicateGeDate'),
    '<=': t('ProofRequest.PredicateLeDate'),
    '<': t('ProofRequest.PredicateLeDate'),
  }
  const pTypeDateOffset: { [key: string]: number | undefined } = {
    '>=': -1,
    '<=': 1,
  }
  if (attributeTypes && attributeTypes[item.name ?? ''] == CaptureBaseAttributeType.DateTime) {
    itemCopy.pType = pTypeDateMap[item.pType] ?? item.pType
    itemCopy.pValue = parseInt(`${itemCopy.pValue}`) + (pTypeDateOffset[item.pType] ?? 0)
  } else {
    itemCopy.pType = pTypeMap[item.pType] ?? item.pType
  }
  return itemCopy
}

/**
 * @deprecated The function should not be used
 */
export const sortCredentialsForAutoSelect = (
  credentials: AnonCredsCredentialsForProofRequest
): AnonCredsCredentialsForProofRequest => {
  const requestedAttributes = Object.values(credentials?.attributes).pop()
  const requestedPredicates = Object.values(credentials?.predicates).pop()
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
 * Useful for multi use invitations
 * @param agent an Agent instance
 * @param invitationId id of invitation
 */
export const removeExistingInvitationIfRequired = async (
  agent: Agent | undefined,
  invitationId: string
): Promise<void> => {
  try {
    const oobRecord = await agent?.oob.findByReceivedInvitationId(invitationId)
    if (oobRecord) {
      await agent?.oob.deleteById(oobRecord.id)
    }
  } catch (error) {
    // findByReceivedInvitationId will throw if unsuccessful but that's not a problem
    // it just means there is nothing to delete
  }
}

/**
 *
 * @param uri a URI containing a base64 encoded connection invite in the query parameter
 * @param agent an Agent instance
 * @returns a connection record from parsing and receiving the invitation
 */
export const connectFromInvitation = async (
  uri: string,
  agent: Agent | undefined,
  implicitInvitations: boolean = false,
  reuseConnection: boolean = false
) => {
  const invitation = await agent?.oob.parseInvitation(uri)

  if (!invitation) {
    throw new Error('Could not parse invitation from URL')
  }

  let record
  if (implicitInvitations) {
    try {
      if (invitation.getDidServices().length > 0) {
        const did = parseDid(invitation.getDidServices()[0])
        record = await agent?.oob.receiveImplicitInvitation({
          did: did.did,
          label: invitation.label,
          handshakeProtocols: invitation.handshakeProtocols as HandshakeProtocol[] | undefined,
        })
      }
    } catch (e) {
      // don't throw an error, will try to connect again below
    }
  }

  if (!record) {
    await removeExistingInvitationIfRequired(agent, invitation.id)
    record = await agent?.oob.receiveInvitation(invitation, { reuseConnection })
  }

  return record
}

/**
 * Create a new connection invitation
 *
 * @param agent an Agent instance
 * @param goalCode add goalCode to connection invitation
 * @returns a connection record
 */
export const createConnectionInvitation = async (agent: Agent | undefined, goalCode?: string) => {
  const record = await agent?.oob.createInvitation({ goalCode })
  if (!record) {
    throw new Error('Could not create new invitation')
  }
  const invitationUrl = record.outOfBandInvitation.toUrl({ domain })

  return {
    record,
    invitation: record.outOfBandInvitation,
    invitationUrl,
  }
}

/**
 * Create a new connection invitation with a goal code specifying that it will be deleted after issuing or verifying once depending on type
 *
 * @param agent an Agent instance
 * @param type add goalCode to connection invitation
 * @returns a connection record
 */
export const createTempConnectionInvitation = async (agent: Agent | undefined, type: 'issue' | 'verify') => {
  return createConnectionInvitation(agent, `aries.vc.${type}.once`)
}

/**
 * Parse URL from provided string
 * @param urlString string to parse
 * @returns ParsedUur object if success or undefined
 */
export const getUrl = (urlString: string): ParsedUrl | undefined => {
  try {
    return parseUrl(urlString)
  } catch (e) {
    return undefined
  }
}

/**
 * Parse JSON from provided string
 * @param jsonString string to parse
 * @returns JSON object if success or undefined
 */
export const getJson = (jsonString: string): Record<string, unknown> | undefined => {
  try {
    return JSON.parse(jsonString)
  } catch (e) {
    return undefined
  }
}

/**
 * Typeguard to check if any React children is represented as a function
 * instead of a Node. I,e., when it's a {@link ChildFn}.
 *
 * @param children any React children
 * @returns true if the children is a function, false otherwise
 */
export function isChildFunction<T>(children: ReactNode | ChildFn<T>): children is ChildFn<T> {
  return typeof children === 'function'
}

export function getCredentialEventRole(record: CredentialExchangeRecord) {
  switch (record.state) {
    // assuming only Holder states are supported here
    case CredentialState.ProposalSent:
      return Role.me
    case CredentialState.OfferReceived:
      return Role.them
    case CredentialState.RequestSent:
      return Role.me
    case CredentialState.Declined:
      return Role.me
    case CredentialState.CredentialReceived:
      return Role.me
    case CredentialState.Done:
      return Role.me
    default:
      return Role.me
  }
}

export function getCredentialEventLabel(record: CredentialExchangeRecord) {
  switch (record.state) {
    // assuming only Holder states are supported here
    case CredentialState.ProposalSent:
      return 'Chat.CredentialProposalSent'
    case CredentialState.OfferReceived:
      return 'Chat.CredentialOfferReceived'
    case CredentialState.RequestSent:
      return 'Chat.CredentialRequestSent'
    case CredentialState.Declined:
      return 'Chat.CredentialDeclined'
    case CredentialState.CredentialReceived:
    case CredentialState.Done:
      return 'Chat.CredentialReceived'
    default:
      return ''
  }
}

export function getProofEventRole(record: ProofExchangeRecord) {
  switch (record.state) {
    case ProofState.RequestSent:
      return Role.me
    case ProofState.ProposalReceived:
      return Role.me
    case ProofState.PresentationReceived:
      return Role.them
    case ProofState.RequestReceived:
      return Role.me
    case ProofState.ProposalSent:
    case ProofState.PresentationSent:
      return Role.me
    case ProofState.Declined:
      return Role.me
    case ProofState.Abandoned:
      return Role.them
    case ProofState.Done:
      return record.isVerified !== undefined ? Role.them : Role.me
    default:
      return Role.me
  }
}

export function getProofEventLabel(record: ProofExchangeRecord) {
  switch (record.state) {
    case ProofState.RequestSent:
    case ProofState.ProposalReceived:
      return 'Chat.ProofRequestSent'
    case ProofState.PresentationReceived:
      return 'Chat.ProofPresentationReceived'
    case ProofState.RequestReceived:
      return 'Chat.ProofRequestReceived'
    case ProofState.ProposalSent:
    case ProofState.PresentationSent:
      return 'Chat.ProofRequestSatisfied'
    case ProofState.Declined:
      return 'Chat.ProofRequestRejected'
    case ProofState.Abandoned:
      return 'Chat.ProofRequestRejectReceived'
    case ProofState.Done:
      return record.isVerified !== undefined ? 'Chat.ProofPresentationReceived' : 'Chat.ProofRequestSatisfied'
    default:
      return ''
  }
}

export function getMessageEventRole(record: BasicMessageRecord) {
  return record.role === BasicMessageRole.Sender ? Role.me : Role.them
}

export function generateRandomWalletName() {
  let name = 'My Wallet - '
  for (let i = 0; i < 4; i++) {
    name = name.concat(Math.floor(Math.random() * 10).toString())
  }
  return name
}
