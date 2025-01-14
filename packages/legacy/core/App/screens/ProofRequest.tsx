import {
  AnonCredsCredentialsForProofRequest,
  AnonCredsRequestedAttributeMatch,
  AnonCredsRequestedPredicateMatch,
  V1RequestPresentationMessage,
} from '@credo-ts/anoncreds'
import {
  CredentialExchangeRecord,
  CredentialRecordBinding,
  DifPexInputDescriptorToCredentials,
  ProofState,
  CredoError,
  V2RequestPresentationMessage,
} from '@credo-ts/core'
import { useConnectionById, useProofById } from '@credo-ts/react-hooks'
import { Attribute, Predicate } from '@hyperledger/aries-oca/build/legacy'
import { useIsFocused } from '@react-navigation/native'
import moment from 'moment'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceEventEmitter, EmitterSubscription, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'

import Button, { ButtonType } from '../components/buttons/Button'
import ConnectionAlert from '../components/misc/ConnectionAlert'
import ConnectionImage from '../components/misc/ConnectionImage'
import { InfoBoxType } from '../components/misc/InfoBox'
import CommonRemoveModal from '../components/modals/CommonRemoveModal'
import ProofCancelModal from '../components/modals/ProofCancelModal'
import InfoTextBox from '../components/texts/InfoTextBox'
import { EventTypes } from '../constants'
import { TOKENS, useServices } from '../container-api'
import { useNetwork } from '../contexts/network'
import { DispatchAction } from '../contexts/reducers/store'
import { useStore } from '../contexts/store'
import { useTheme } from '../contexts/theme'
import { useTour } from '../contexts/tour/tour-context'
import { useOutOfBandByConnectionId } from '../hooks/connections'
import { useOutOfBandByReceivedInvitationId } from '../hooks/oob'
import { useAllCredentialsForProof } from '../hooks/proofs'
import { AttestationEventTypes } from '../types/attestation'
import { BifoldError } from '../types/error'
import { Screens, Stacks, TabStacks } from '../types/navigators'
import {
  CredentialDataForProof,
  ProofCredentialAttributes,
  ProofCredentialItems,
  ProofCredentialPredicates,
} from '../types/proof-items'
import { ModalUsage } from '../types/remove'
import { TourID } from '../types/tour'
import { useAppAgent } from '../utils/agent'
import { DescriptorMetadata } from '../utils/anonCredsProofRequestMapper'
import {
  Fields,
  evaluatePredicates,
  getConnectionName,
  getCredentialDefinitionIdForRecord,
  getCredentialSchemaIdForRecord,
} from '../utils/helpers'
import { testIdWithKey } from '../utils/testable'
import LoadingPlaceholder, { LoadingPlaceholderWorkflowType } from '../components/views/LoadingPlaceholder'

import ProofRequestAccept from './ProofRequestAccept'
import { HistoryCardType, HistoryRecord } from '../modules/history/types'
import ProofRequestCredentialList from '../components/views/ProofRequestCredentialList'

type ProofRequestProps = {
  navigation: any
  proofId: string
}

const ProofRequest: React.FC<ProofRequestProps> = ({ navigation, proofId }) => {
  const { agent } = useAppAgent()
  const { t } = useTranslation()
  const { assertNetworkConnected } = useNetwork()
  const proof = useProofById(proofId)
  const connection = useConnectionById(proof?.connectionId ?? '')
  const [pendingModalVisible, setPendingModalVisible] = useState(false)
  const [revocationOffense, setRevocationOffense] = useState(false)
  const [retrievedCredentials, setRetrievedCredentials] = useState<AnonCredsCredentialsForProofRequest>()
  // all credentials in the users wallet
  const [userCredentials, setUserCredentials] = useState<ProofCredentialItems[]>([])
  const [missingCredentials, setMissingCredentials] = useState<ProofCredentialItems[]>([])
  const [descriptorMetadata, setDescriptorMetadata] = useState<DescriptorMetadata | undefined>()
  const [loading, setLoading] = useState<boolean>(true)
  const [declineModalVisible, setDeclineModalVisible] = useState(false)
  const [cancelModalVisible, setCancelModalVisible] = useState(false)
  const { ColorPallet, ListItems, TextTheme } = useTheme()
  const goalCode = useOutOfBandByConnectionId(proof?.connectionId ?? '')?.outOfBandInvitation.goalCode
  const outOfBandInvitation = useOutOfBandByReceivedInvitationId(proof?.parentThreadId ?? '')?.outOfBandInvitation
  const [containsPI, setContainsPI] = useState(false)
  const [activeCreds, setActiveCreds] = useState<ProofCredentialItems[]>([])
  const [selectedCredentials, setSelectedCredentials] = useState<string[]>([])
  const [attestationLoading, setAttestationLoading] = useState(false)
  const [store, dispatch] = useStore()
  const credProofPromise = useAllCredentialsForProof(proofId)
  const proofConnectionLabel = useMemo(
    () => getConnectionName(connection, store.preferences.alternateContactNames),
    [connection, store.preferences.alternateContactNames]
  )
  const { start } = useTour()
  const screenIsFocused = useIsFocused()
  const [
    bundleResolver,
    attestationMonitor,
    { enableTours: enableToursConfig },
    logger,
    historyManagerCurried,
    historyEnabled,
    historyEventsLogger,
  ] = useServices([
    TOKENS.UTIL_OCA_RESOLVER,
    TOKENS.UTIL_ATTESTATION_MONITOR,
    TOKENS.CONFIG,
    TOKENS.UTIL_LOGGER,
    TOKENS.FN_LOAD_HISTORY,
    TOKENS.HISTORY_ENABLED,
    TOKENS.HISTORY_EVENTS_LOGGER,
  ])

  const styles = StyleSheet.create({
    pageContainer: {
      flex: 1,
    },
    pageContent: {
      flexGrow: 1,
      justifyContent: 'space-between',
    },
    pageMargin: {
      marginHorizontal: 20,
    },
    pageFooter: {
      marginVertical: 15,
    },
    headerTextContainer: {
      paddingVertical: 16,
    },
    headerText: {
      ...ListItems.recordAttributeText,
      flexShrink: 1,
    },
    footerButton: {
      paddingTop: 10,
    },
    link: {
      ...ListItems.recordAttributeText,
      ...ListItems.recordLink,
      paddingVertical: 2,
    },
    valueContainer: {
      minHeight: ListItems.recordAttributeText.fontSize,
      paddingVertical: 4,
    },
    detailsButton: {
      ...ListItems.recordAttributeText,
      color: ColorPallet.brand.link,
      textDecorationLine: 'underline',
    },
  })

  useEffect(() => {
    if (!attestationMonitor) {
      return
    }

    const handleStartedAttestation = () => {
      setAttestationLoading(true)
    }

    const handleStartedCompleted = () => {
      setAttestationLoading(false)
    }

    const handleFailedAttestation = (error: BifoldError) => {
      DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
    }

    const subscriptions = Array<EmitterSubscription>()
    subscriptions.push(DeviceEventEmitter.addListener(AttestationEventTypes.Started, handleStartedAttestation))
    subscriptions.push(DeviceEventEmitter.addListener(AttestationEventTypes.Completed, handleStartedCompleted))
    subscriptions.push(DeviceEventEmitter.addListener(AttestationEventTypes.FailedHandleProof, handleFailedAttestation))
    subscriptions.push(DeviceEventEmitter.addListener(AttestationEventTypes.FailedHandleOffer, handleFailedAttestation))
    subscriptions.push(
      DeviceEventEmitter.addListener(AttestationEventTypes.FailedRequestCredential, handleFailedAttestation)
    )

    return () => {
      subscriptions.forEach((subscription) => subscription.remove())
    }
  }, [attestationMonitor])

  useEffect(() => {
    const shouldShowTour = enableToursConfig && store.tours.enableTours && !store.tours.seenProofRequestTour

    if (shouldShowTour && screenIsFocused) {
      start(TourID.ProofRequestTour)
      dispatch({
        type: DispatchAction.UPDATE_SEEN_PROOF_REQUEST_TOUR,
        payload: [true],
      })
    }
  }, [enableToursConfig, store.tours.enableTours, store.tours.seenProofRequestTour, screenIsFocused, start, dispatch])

  useEffect(() => {
    if (!agent || !proof) {
      DeviceEventEmitter.emit(
        EventTypes.ERROR_ADDED,
        new BifoldError(t('Error.Title1034'), t('Error.Message1034'), t('ProofRequest.ProofRequestNotFound'), 1034)
      )
    }
  }, [agent, proof, t])

  const containsRevokedCreds = (
    credExRecords: CredentialExchangeRecord[],
    fields: {
      [key: string]: Attribute[] & Predicate[]
    }
  ): boolean => {
    const revList = credExRecords.map((cred) => {
      return {
        id: cred.credentials.map((item) => item.credentialRecordId),
        revocationDate: cred.revocationNotification?.revocationDate,
      }
    })

    return revList.some((item) => {
      const revDate = moment(item.revocationDate)
      return item.id.some((id) => {
        return Object.keys(fields).some((key) => {
          const dateIntervals = fields[key]
            ?.filter((attr) => attr.credentialId === id)
            .map((attr) => {
              return {
                to: attr.nonRevoked?.to !== undefined ? moment.unix(attr.nonRevoked.to) : undefined,
                from: attr.nonRevoked?.from !== undefined ? moment.unix(attr.nonRevoked.from) : undefined,
              }
            })
          return dateIntervals?.some(
            (inter) =>
              (inter.to !== undefined && inter.to > revDate) || (inter.from !== undefined && inter.from > revDate)
          )
        })
      })
    })
  }

  useEffect(() => {
    setLoading(true)
    const credPromise = async () => {
      let value: CredentialDataForProof | undefined = undefined
      try {
        value = await credProofPromise

        if (!value) {
          return
        }
      } catch (err) {
        const error = new BifoldError(
          t('Error.Title1026'),
          t('Error.Message1026'),
          (err as Error)?.message ?? err,
          1026
        )
        DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
        return
      }

      const { groupedProof, retrievedCredentials, fullCredentials, descriptorMetadata } = value
      setLoading(false)
      setDescriptorMetadata(descriptorMetadata)

      // Credentials that satisfy the proof request
      let credList: string[] = []
      if (selectedCredentials.length > 0) {
        credList = selectedCredentials
      } else {
        // we only want one of each satisfying credential
        groupedProof.forEach((item: any) => {
          const credId = item.altCredentials?.[0]
          if (credId && !credList.includes(credId)) {
            credList.push(credId)
          }
        })
      }

      const formatCredentials = (
        retrievedItems: Record<string, (AnonCredsRequestedAttributeMatch | AnonCredsRequestedPredicateMatch)[]>,
        credList: string[]
      ) => {
        return Object.keys(retrievedItems)
          .map((key) => {
            return {
              [key]: retrievedItems[key].filter((attr) => credList.includes(attr.credentialId)),
            }
          })
          .reduce((prev, curr) => {
            return {
              ...prev,
              ...curr,
            }
          }, {})
      }

      const selectRetrievedCredentials: AnonCredsCredentialsForProofRequest | undefined = retrievedCredentials
        ? {
            ...retrievedCredentials,
            attributes: formatCredentials(retrievedCredentials.attributes, credList) as Record<
              string,
              AnonCredsRequestedAttributeMatch[]
            >,
            predicates: formatCredentials(retrievedCredentials.predicates, credList) as Record<
              string,
              AnonCredsRequestedPredicateMatch[]
            >,
          }
        : undefined

      setRetrievedCredentials(selectRetrievedCredentials)

      const activeCreds = groupedProof.filter((item: any) => credList.includes(item.credId))
      setActiveCreds(activeCreds)

      const unpackCredToField = (
        credentials: (ProofCredentialAttributes & ProofCredentialPredicates)[]
      ): { [key: string]: Attribute[] & Predicate[] } => {
        return credentials.reduce((prev, current) => {
          return { ...prev, [current.credId]: current.attributes ?? current.predicates ?? [] }
        }, {})
      }

      const userCredentials: ProofCredentialItems[] = []
      const missingCredentials: ProofCredentialItems[] = []
      const schemaIds = new Set(
        fullCredentials
          .map((fullCredential: CredentialExchangeRecord) => getCredentialSchemaIdForRecord(fullCredential))
          .filter((id) => id !== null)
      )
      const credDefIds = new Set(
        fullCredentials
          .map((fullCredential: CredentialExchangeRecord) => getCredentialDefinitionIdForRecord(fullCredential))
          .filter((id) => id !== null)
      )
      activeCreds.forEach((cred) => {
        const isMissing = !schemaIds.has(cred.schemaId ?? '') && !credDefIds.has(cred.credDefId ?? '')
        const isUserCredential = schemaIds.has(cred.schemaId ?? '') || credDefIds.has(cred.credDefId ?? '')

        if (isMissing && !cred.credExchangeRecord) {
          missingCredentials.push(cred)
        }

        if (isUserCredential || cred.credExchangeRecord) {
          userCredentials.push(cred)
        }
      })
      setUserCredentials(userCredentials)
      setMissingCredentials(missingCredentials)

      // Check for revoked credentials
      const records = fullCredentials.filter((record: CredentialExchangeRecord) =>
        record.credentials.some((cred: CredentialRecordBinding) => credList.includes(cred.credentialRecordId))
      )
      const foundRevocationOffense =
        containsRevokedCreds(records, unpackCredToField(activeCreds)) ||
        containsRevokedCreds(records, unpackCredToField(activeCreds))
      setRevocationOffense(foundRevocationOffense)
    }

    credPromise()
  }, [selectedCredentials, credProofPromise, t])

  const toggleDeclineModalVisible = useCallback(() => setDeclineModalVisible((prev) => !prev), [])
  const toggleCancelModalVisible = useCallback(() => setCancelModalVisible((prev) => !prev), [])

  const getCredentialsFields = useCallback(
    (): Fields => ({
      ...retrievedCredentials?.attributes,
      ...retrievedCredentials?.predicates,
    }),
    [retrievedCredentials]
  )

  useEffect(() => {
    // get oca bundle to see if we're presenting personally identifiable elements
    activeCreds.some(async (item) => {
      if (!item || !(item.credDefId || item.schemaId)) {
        return false
      }
      const labels = (item.attributes ?? []).map((field) => field.label ?? field.name ?? '')
      const bundle = await bundleResolver.resolveAllBundles({
        identifiers: { credentialDefinitionId: item.credDefId, schemaId: item.schemaId },
      })
      const flaggedAttributes: string[] = (bundle as any).bundle.bundle.flaggedAttributes.map((attr: any) => attr.name)
      const foundPI = labels.some((label) => flaggedAttributes.includes(label))
      setContainsPI(foundPI)
      return foundPI
    })
  }, [activeCreds, bundleResolver])

  const hasAvailableCredentials = useMemo(() => {
    const fields = getCredentialsFields()

    return !!retrievedCredentials && Object.values(fields).every((c) => c.length > 0)
  }, [retrievedCredentials, getCredentialsFields])

  const hasSatisfiedPredicates = useCallback(
    (fields: Fields, credId?: string) => {
      return activeCreds.flatMap((item) => evaluatePredicates(fields, credId)(item)).every((p) => p.satisfied)
    },
    [activeCreds]
  )

  const logHistoryRecord = useCallback(
    async (type: HistoryCardType) => {
      try {
        if (!(agent && historyEnabled)) {
          logger.trace(
            `[${ProofRequest.name}]:[logHistoryRecord] Skipping history log, either history function disabled or agent undefined!`
          )
          return
        }
        const historyManager = historyManagerCurried(agent)

        if (!proof) {
          logger.error(`[${ProofRequest.name}]:[logHistoryRecord] Cannot save history, proof undefined!`)
          return
        }

        let message: V2RequestPresentationMessage | V1RequestPresentationMessage | null | undefined
        try {
          message = await agent?.proofs.findRequestMessage(proofId)
        } catch (error) {
          logger.error('Error finding request message:', error as CredoError)
        }

        /** Save history record for proof accepted/declined */
        const recordData: HistoryRecord = {
          type: type,
          message: message?.comment ?? '',
          createdAt: proof.createdAt,
          correspondenceId: proofId,
          correspondenceName: proofConnectionLabel,
        }
        historyManager.saveHistory(recordData)
      } catch (err: unknown) {
        logger.error(`[${ProofRequest.name}]:[logHistoryRecord] Error saving history: ${err}`)
      }
    },
    [agent, historyEnabled, logger, historyManagerCurried, proof, proofId, proofConnectionLabel]
  )

  const handleAcceptPress = useCallback(async () => {
    try {
      if (!(agent && proof && assertNetworkConnected())) {
        return
      }
      setPendingModalVisible(true)

      if (!retrievedCredentials) {
        throw new Error(t('ProofRequest.RequestedCredentialsCouldNotBeFound'))
      }
      const format = await agent.proofs.getFormatData(proof.id)

      if (format.request?.presentationExchange) {
        if (!descriptorMetadata) throw new Error(t('ProofRequest.PresentationMetadataNotFound'))

        const selectedCredentials: DifPexInputDescriptorToCredentials = Object.fromEntries(
          Object.entries(descriptorMetadata).map(([descriptorId, meta]) => {
            const activeCredentialIds = activeCreds.map((cred) => cred.credId)
            const selectedRecord = meta.find((item) => activeCredentialIds.includes(item.record.id))
            if (!selectedRecord) throw new Error(t('ProofRequest.CredentialMetadataNotFound'))
            return [descriptorId, [selectedRecord.record]]
          })
        )

        await agent.proofs.acceptRequest({
          proofRecordId: proof.id,
          proofFormats: { presentationExchange: { credentials: selectedCredentials } },
        })

        if (proof.connectionId && goalCode && goalCode.endsWith('verify.once')) {
          agent.connections.deleteById(proof.connectionId)
        }
        return
      }

      const formatToUse = format.request?.anoncreds ? 'anoncreds' : 'indy'

      const formatCredentials = (
        retrievedItems: Record<string, (AnonCredsRequestedAttributeMatch | AnonCredsRequestedPredicateMatch)[]>,
        credList: string[]
      ) => {
        return Object.keys(retrievedItems)
          .map((key) => {
            return {
              [key]: retrievedItems[key].find((cred) => credList.includes(cred.credentialId)),
            }
          })
          .reduce((prev, current) => {
            return { ...prev, ...current }
          }, {})
      }

      // this is the best way to supply our desired credentials in the proof, otherwise it selects them automatically
      const credObject = {
        ...retrievedCredentials,
        attributes: formatCredentials(
          retrievedCredentials.attributes,
          activeCreds.map((item) => item.credId)
        ),
        predicates: formatCredentials(
          retrievedCredentials.predicates,
          activeCreds.map((item) => item.credId)
        ),
        selfAttestedAttributes: {},
      }
      const automaticRequestedCreds = { proofFormats: { [formatToUse]: { ...credObject } } }

      if (!automaticRequestedCreds) {
        throw new Error(t('ProofRequest.RequestedCredentialsCouldNotBeFound'))
      }

      await agent.proofs.acceptRequest({
        proofRecordId: proof.id,
        proofFormats: automaticRequestedCreds.proofFormats,
      })
      if (proof.connectionId && goalCode && goalCode.endsWith('verify.once')) {
        agent.connections.deleteById(proof.connectionId)
      }

      if (historyEventsLogger.logInformationSent) {
        logHistoryRecord(HistoryCardType.InformationSent)
      }
    } catch (err: unknown) {
      setPendingModalVisible(false)
      const error = new BifoldError(t('Error.Title1027'), t('Error.Message1027'), (err as Error)?.message ?? err, 1027)
      DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
    }
  }, [
    agent,
    proof,
    assertNetworkConnected,
    retrievedCredentials,
    activeCreds,
    descriptorMetadata,
    goalCode,
    t,
    historyEventsLogger.logInformationSent,
    logHistoryRecord,
  ])

  const handleDeclineTouched = useCallback(async () => {
    try {
      if (agent && proof) {
        await agent.proofs.sendProblemReport({ proofRecordId: proof.id, description: t('ProofRequest.Declined') })
        await agent.proofs.declineRequest({ proofRecordId: proof.id })

        if (proof.connectionId && goalCode && goalCode.endsWith('verify.once')) {
          agent.connections.deleteById(proof.connectionId)
        }
      }
    } catch (err: unknown) {
      const error = new BifoldError(t('Error.Title1028'), t('Error.Message1028'), (err as Error)?.message ?? err, 1028)
      DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
    }

    toggleDeclineModalVisible()

    if (historyEventsLogger.logInformationNotSent) {
      logHistoryRecord(HistoryCardType.InformationNotSent)
    }
    navigation.getParent()?.navigate(TabStacks.HomeStack, { screen: Screens.Home })
  }, [
    agent,
    proof,
    goalCode,
    t,
    navigation,
    toggleDeclineModalVisible,
    historyEventsLogger.logInformationNotSent,
    logHistoryRecord,
  ])

  const handleCancelTouched = useCallback(async () => {
    try {
      toggleCancelModalVisible()

      if (agent && proof) {
        await agent.proofs.sendProblemReport({ proofRecordId: proof.id, description: t('ProofRequest.Declined') })
        await agent.proofs.declineRequest({ proofRecordId: proof.id })

        if (proof.connectionId && goalCode && goalCode.endsWith('verify.once')) {
          agent.connections.deleteById(proof.connectionId)
        }
      }
    } catch (err: unknown) {
      const error = new BifoldError(t('Error.Title1028'), t('Error.Message1028'), (err as Error)?.message ?? err, 1028)
      DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
    }
  }, [toggleCancelModalVisible, agent, proof, t, goalCode])

  const onCancelDone = useCallback(() => {
    navigation.getParent()?.navigate(TabStacks.HomeStack, { screen: Screens.Home })
  }, [navigation])

  const isShareDisabled = useCallback(() => {
    return (
      !hasAvailableCredentials ||
      !hasSatisfiedPredicates(getCredentialsFields()) ||
      revocationOffense ||
      proof?.state !== ProofState.RequestReceived
    )
  }, [hasAvailableCredentials, hasSatisfiedPredicates, getCredentialsFields, revocationOffense, proof])

  const proofPageHeader = () => {
    return (
      <View style={styles.pageMargin}>
        {attestationLoading && (
          <View style={{ paddingTop: 20 }}>
            <InfoTextBox>{t('ProofRequest.JustAMoment')}</InfoTextBox>
          </View>
        )}
        {loading || attestationLoading ? (
          <LoadingPlaceholder
            workflowType={LoadingPlaceholderWorkflowType.ProofRequested}
            timeoutDurationInMs={10000}
            loadingProgressPercent={30}
            onCancelTouched={async () => {
              await handleDeclineTouched()
            }}
            testID={testIdWithKey('ProofRequestLoading')}
          />
        ) : (
          <>
            <ConnectionImage connectionId={proof?.connectionId} />
            <View style={styles.headerTextContainer}>
              {hasAvailableCredentials && !hasSatisfiedPredicates(getCredentialsFields()) ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon
                    style={{ marginLeft: -2, marginRight: 10 }}
                    name="highlight-off"
                    color={ListItems.proofIcon.color}
                    size={ListItems.proofIcon.fontSize}
                  />

                  <Text style={styles.headerText} testID={testIdWithKey('HeaderText')}>
                    {t('ProofRequest.YouDoNotHaveDataPredicate')}{' '}
                    <Text style={TextTheme.title}>
                      {proofConnectionLabel || outOfBandInvitation?.label || t('ContactDetails.AContact')}
                    </Text>
                  </Text>
                </View>
              ) : (
                <Text style={styles.headerText} testID={testIdWithKey('HeaderText')}>
                  <Text style={TextTheme.title}>
                    {proofConnectionLabel || outOfBandInvitation?.label || t('ContactDetails.AContact')}
                  </Text>{' '}
                  <Text>{t('ProofRequest.IsRequestingYouToShare')}</Text>
                  <Text style={TextTheme.title}>{` ${activeCreds?.length} `}</Text>
                  <Text>{activeCreds?.length > 1 ? t('ProofRequest.Credentials') : t('ProofRequest.Credential')}</Text>
                </Text>
              )}
              {isShareDisabled() && (
                <InfoTextBox type={InfoBoxType.Error} style={{ marginTop: 16 }} textStyle={{ fontWeight: 'normal' }}>
                  {t('ProofRequest.YouCantRespond')}
                </InfoTextBox>
              )}
            </View>
          </>
        )}
      </View>
    )
  }

  const handleAltCredChange = useCallback(
    (selectedCred: string, altCredentials: string[]) => {
      const onCredChange = (cred: string) => {
        const newSelectedCreds = (
          selectedCredentials.length > 0 ? selectedCredentials : activeCreds.map((item) => item.credId)
        ).filter((id) => !altCredentials.includes(id))
        setSelectedCredentials([cred, ...newSelectedCreds])
      }
      navigation.getParent()?.navigate(Stacks.ProofRequestsStack, {
        screen: Screens.ProofChangeCredential,
        params: {
          selectedCred,
          altCredentials,
          proofId,
          onCredChange,
        },
      })
    },
    [selectedCredentials, activeCreds, proofId, navigation]
  )

  const proofPageFooter = () => {
    return (
      <View style={[styles.pageFooter, styles.pageMargin]}>
        {containsPI && (
          <InfoTextBox
            type={InfoBoxType.Warn}
            style={{ marginTop: 16 }}
            textStyle={{ fontSize: TextTheme.title.fontSize }}
          >
            {t('ProofRequest.SensitiveInformation')}
          </InfoTextBox>
        )}
        {!loading && proofConnectionLabel && goalCode === 'aries.vc.verify' ? (
          <ConnectionAlert connectionID={proofConnectionLabel} />
        ) : null}
        {!loading && isShareDisabled() ? (
          <View style={styles.footerButton}>
            <Button
              title={t('Global.Cancel')}
              accessibilityLabel={t('Global.Cancel')}
              testID={testIdWithKey('Cancel')}
              buttonType={ButtonType.Primary}
              onPress={handleCancelTouched}
            />
          </View>
        ) : (
          <>
            {!loading && (
              <>
                <View style={styles.footerButton}>
                  <Button
                    title={t('Global.Share')}
                    accessibilityLabel={t('Global.Share')}
                    testID={testIdWithKey('Share')}
                    buttonType={ButtonType.Primary}
                    onPress={handleAcceptPress}
                  />
                </View>
                <View style={styles.footerButton}>
                  <Button
                    title={t('Global.Decline')}
                    accessibilityLabel={t('Global.Decline')}
                    testID={testIdWithKey('Decline')}
                    buttonType={!retrievedCredentials ? ButtonType.Primary : ButtonType.Secondary}
                    onPress={toggleDeclineModalVisible}
                  />
                </View>
              </>
            )}
          </>
        )}
      </View>
    )
  }

  const credentialListHeader = (headerText: string) => {
    return (
      <View style={styles.pageMargin}>
        {!(loading || attestationLoading) && (
          <Text
            testID={testIdWithKey('ProofRequestHeaderText')}
            style={{
              ...TextTheme.title,
              marginTop: 10,
            }}
          >
            {headerText}
          </Text>
        )}
      </View>
    )
  }
  return (
    <SafeAreaView style={styles.pageContainer} edges={['bottom', 'left', 'right']}>
      <ScrollView>
        <View style={styles.pageContent}>
          {proofPageHeader()}
          {/* This list will render if any credentials in a proof request are not in the users wallet */}
          <ProofRequestCredentialList
            header={
              missingCredentials.length > 0 && userCredentials.length > 0
                ? credentialListHeader(t('ProofRequest.MissingCredentials'))
                : undefined
            }
            items={missingCredentials}
            missing={true}
            footer={
              missingCredentials.length > 0 && userCredentials.length > 0 ? (
                <View
                  style={{
                    width: 'auto',
                    borderWidth: 1,
                    borderColor: ColorPallet.grayscale.lightGrey,
                    marginTop: 20,
                  }}
                />
              ) : undefined
            }
          />
          <ProofRequestCredentialList
            header={
              missingCredentials.length > 0 && userCredentials.length > 0
                ? credentialListHeader(t('ProofRequest.FromYourWallet'))
                : undefined
            }
            items={userCredentials}
            missing={false}
            loading={loading}
            attestationLoading={attestationLoading}
            hasSatisfiedPredicates={hasSatisfiedPredicates}
            getCredentialsFields={getCredentialsFields}
            displayItems={(item) => [
              ...(item.attributes ?? []),
              ...evaluatePredicates(getCredentialsFields(), item.credId)(item),
            ]}
            handleAltCredChange={(item) => {
              item.altCredentials && item.altCredentials.length > 1
                ? () => {
                    handleAltCredChange(item.credId, item.altCredentials ?? [item.credId])
                  }
                : undefined
            }}
          />
          {proofPageFooter()}
        </View>
        <ProofRequestAccept visible={pendingModalVisible} proofId={proofId} />
        <CommonRemoveModal
          usage={ModalUsage.ProofRequestDecline}
          visible={declineModalVisible}
          onSubmit={handleDeclineTouched}
          onCancel={toggleDeclineModalVisible}
        />
        <ProofCancelModal visible={cancelModalVisible} onDone={onCancelDone} />
      </ScrollView>
    </SafeAreaView>
  )
}

export default ProofRequest
