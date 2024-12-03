import type { StackScreenProps } from '@react-navigation/stack'

import { CredentialExchangeRecord } from '@credo-ts/core'
import { useAgent } from '@credo-ts/react-hooks'
import { BrandingOverlay } from '@hyperledger/aries-oca'
import { Attribute, BrandingOverlayType, CredentialOverlay } from '@hyperledger/aries-oca/build/legacy'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DeviceEventEmitter, Image, ImageBackground, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import CardWatermark from '../components/misc/CardWatermark'
import CredentialCard from '../components/misc/CredentialCard'
import InfoBox, { InfoBoxType } from '../components/misc/InfoBox'
import CommonRemoveModal from '../components/modals/CommonRemoveModal'
import Record from '../components/record/Record'
import RecordRemove from '../components/record/RecordRemove'
import { ToastType } from '../components/toast/BaseToast'
import { EventTypes } from '../constants'
import { TOKENS, useServices } from '../container-api'
import { useTheme } from '../contexts/theme'
import { BifoldError } from '../types/error'
import { CredentialMetadata, credentialCustomMetadata } from '../types/metadata'
import { CredentialStackParams, Screens, Stacks } from '../types/navigators'
import { ModalUsage } from '../types/remove'
import {
  credentialTextColor,
  getCredentialIdentifiers,
  isValidAnonCredsCredential,
  toImageSource,
} from '../utils/credential'
import { formatTime, useCredentialConnectionLabel } from '../utils/helpers'
import { buildFieldsFromAnonCredsCredential } from '../utils/oca'
import { testIdWithKey } from '../utils/testable'
import { TouchableOpacity } from 'react-native-gesture-handler'

type CredentialDetailsProps = StackScreenProps<CredentialStackParams, Screens.CredentialDetails>

const CredentialDetails: React.FC<CredentialDetailsProps> = ({ navigation, route }) => {
  if (!route?.params) {
    throw new Error('CredentialDetails route params were not set properly')
  }

  const { credentialId } = route.params
  const [credential, setCredential] = useState<CredentialExchangeRecord | undefined>(undefined)
  const { agent } = useAgent()
  const { t, i18n } = useTranslation()
  const { TextTheme, ColorPallet, Assets } = useTheme()
  const [bundleResolver] = useServices([TOKENS.UTIL_OCA_RESOLVER])
  const isBrandindOverlay10 = bundleResolver.getBrandingOverlayType() === BrandingOverlayType.Branding10
  const isBrandindOverlay11 = bundleResolver.getBrandingOverlayType() === BrandingOverlayType.Branding11
  const [isRevoked, setIsRevoked] = useState<boolean>(false)
  const [revocationDate, setRevocationDate] = useState<string>('')
  const [preciseRevocationDate, setPreciseRevocationDate] = useState<string>('')
  const [isRemoveModalDisplayed, setIsRemoveModalDisplayed] = useState<boolean>(false)
  const [isRevokedMessageHidden, setIsRevokedMessageHidden] = useState<boolean>(
    (credential?.metadata.get(CredentialMetadata.customMetadata) as credentialCustomMetadata)
      ?.revoked_detail_dismissed ?? false
  )

  useEffect(() => {
    // fetch credential for ID
    const fetchCredential = async () => {
      try {
        const credentialExchangeRecord = await agent?.credentials.getById(credentialId)
        setCredential(credentialExchangeRecord)
      } catch (error) {
        // credential not found for id, display an error
        DeviceEventEmitter.emit(
          EventTypes.ERROR_ADDED,
          new BifoldError(t('Error.Title1033'), t('Error.Message1033'), t('CredentialDetails.CredentialNotFound'), 1033)
        )
      }
    }
    fetchCredential()
  }, [credentialId, agent, t])

  const darkenColor = (hex: string, percent: number) => {
    hex = hex.replace(/^#/, '')

    let r = parseInt(hex.substring(0, 2), 16)
    let g = parseInt(hex.substring(2, 4), 16)
    let b = parseInt(hex.substring(4, 6), 16)

    r = Math.max(0, Math.min(255, r - (r * percent) / 100))
    g = Math.max(0, Math.min(255, g - (g * percent) / 100))
    b = Math.max(0, Math.min(255, b - (b * percent) / 100))

    const red = Math.round(r).toString(16).padStart(2, '0')
    const green = Math.round(g).toString(16).padStart(2, '0')
    const blue = Math.round(b).toString(16).padStart(2, '0')

    return `#${red}${green}${blue}`
  }

  const [overlay, setOverlay] = useState<CredentialOverlay<BrandingOverlay>>({
    bundle: undefined,
    presentationFields: [],
    metaOverlay: undefined,
    brandingOverlay: undefined,
  })
  const credentialConnectionLabel = useCredentialConnectionLabel(credential)
  const { width, height } = useWindowDimensions()

  const paddingHorizontal = 24
  const paddingVertical = isBrandindOverlay10 ? 16 : 12
  const logoHeight = isBrandindOverlay10 ? 80 : width * 0.12
  const secondaryBodyHeight = 80

  const secondaryBgHeader = overlay.brandingOverlay?.backgroundImage
    ? 'rgba(0, 0, 0, 0)'
    : isBrandindOverlay11 && overlay.brandingOverlay?.secondaryBackgroundColor
    ? darkenColor(overlay.brandingOverlay.secondaryBackgroundColor, 15)
    : overlay.brandingOverlay?.secondaryBackgroundColor ?? 'rgba(0, 0, 0, 0.24)'

  const styles = StyleSheet.create({
    container: {
      backgroundColor: overlay.brandingOverlay?.primaryBackgroundColor,
      display: 'flex',
    },
    secondaryHeaderContainer: {
      height: 1.5 * secondaryBodyHeight,
      backgroundColor: secondaryBgHeader,
    },
    primaryHeaderContainer: {
      paddingHorizontal,
      paddingVertical,
      ...(isBrandindOverlay11 && {
        backgroundColor: overlay.brandingOverlay?.secondaryBackgroundColor ?? 'transparent',
      }),
    },
    statusContainer: {},
    logoContainer: {
      ...(isBrandindOverlay10 && {
        top: -0.5 * logoHeight,
        left: paddingHorizontal,
        marginBottom: -1 * logoHeight,
      }),
      width: logoHeight,
      height: logoHeight,
      backgroundColor: '#ffffff',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 1,
        height: 1,
      },
      shadowOpacity: 0.3,
    },
    textContainer: {
      color: credentialTextColor(ColorPallet, overlay.brandingOverlay?.primaryBackgroundColor),
    },
    issuerBranding11Containter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    issuerAndLogoBrangind11Container: {
      flexDirection: 'row',
      flex: 9,
      alignItems: 'center',
    },
  })

  useEffect(() => {
    if (!agent) {
      DeviceEventEmitter.emit(
        EventTypes.ERROR_ADDED,
        new BifoldError(t('Error.Title1033'), t('Error.Message1033'), t('CredentialDetails.CredentialNotFound'), 1033)
      )
    }
  }, [agent, t])

  useEffect(() => {
    if (!(credential && isValidAnonCredsCredential(credential))) {
      return
    }

    credential.revocationNotification == undefined ? setIsRevoked(false) : setIsRevoked(true)
    if (credential?.revocationNotification?.revocationDate) {
      const date = new Date(credential.revocationNotification.revocationDate)
      setRevocationDate(formatTime(date, { shortMonth: true }))
      setPreciseRevocationDate(formatTime(date, { includeHour: true }))
    }

    const params = {
      identifiers: getCredentialIdentifiers(credential),
      meta: {
        alias: credentialConnectionLabel,
        credConnectionId: credential.connectionId,
      },
      attributes: buildFieldsFromAnonCredsCredential(credential),
      language: i18n.language,
    }

    bundleResolver.resolveAllBundles(params).then((bundle) => {
      setOverlay((o) => ({
        ...o,
        ...(bundle as CredentialOverlay<BrandingOverlay>),
        presentationFields: bundle.presentationFields?.filter((field) => (field as Attribute).value),
      }))
    })
  }, [credential, credentialConnectionLabel, bundleResolver, i18n.language])

  useEffect(() => {
    if (credential?.revocationNotification) {
      const meta = credential.metadata.get(CredentialMetadata.customMetadata)
      credential.metadata.set(CredentialMetadata.customMetadata, { ...meta, revoked_seen: true })
      agent?.credentials.update(credential)
    }
  }, [credential, agent])

  const callOnRemove = useCallback(() => {
    setIsRemoveModalDisplayed(true)
  }, [])

  const callSubmitRemove = useCallback(async () => {
    try {
      if (!(agent && credential)) {
        return
      }

      await agent.credentials.deleteById(credential.id)

      navigation.pop()

      // FIXME: This delay is a hack so that the toast doesn't appear until the modal is dismissed
      await new Promise((resolve) => setTimeout(resolve, 1000))

      Toast.show({
        type: ToastType.Success,
        text1: t('CredentialDetails.CredentialRemoved'),
      })
    } catch (err: unknown) {
      const error = new BifoldError(t('Error.Title1032'), t('Error.Message1032'), (err as Error)?.message ?? err, 1032)
      DeviceEventEmitter.emit(EventTypes.ERROR_ADDED, error)
    }
  }, [agent, credential, navigation, t])

  const callCancelRemove = useCallback(() => {
    setIsRemoveModalDisplayed(false)
  }, [])

  const callDismissRevokedMessage = useCallback(() => {
    setIsRevokedMessageHidden(true)
    if (credential) {
      const meta = credential.metadata.get(CredentialMetadata.customMetadata)
      credential.metadata.set(CredentialMetadata.customMetadata, { ...meta, revoked_detail_dismissed: true })
      agent?.credentials.update(credential)
    }
  }, [credential, agent])

  const CredentialCardLogo: React.FC = () => {
    const text = isBrandindOverlay10
      ? (overlay.metaOverlay?.name ?? overlay.metaOverlay?.issuer ?? 'C')?.charAt(0).toUpperCase()
      : (overlay.metaOverlay?.issuer ?? 'I')?.charAt(0).toUpperCase()
    return (
      <View style={styles.logoContainer}>
        {overlay.brandingOverlay?.logo ? (
          <Image
            source={toImageSource(overlay.brandingOverlay?.logo)}
            style={{
              resizeMode: 'cover',
              width: logoHeight,
              height: logoHeight,
              borderRadius: 8,
            }}
          />
        ) : (
          <Text style={[TextTheme.title, { fontSize: 0.5 * logoHeight, color: '#000' }]}>{text}</Text>
        )}
      </View>
    )
  }

  const navigateToContactDetails = () => {
    if (credential?.connectionId) {
      navigation.getParent()?.navigate(Stacks.ContactStack, {
        screen: Screens.ContactDetails,
        params: { connectionId: credential.connectionId },
      })
    }
  }

  const CredentialDetailPrimaryHeader: React.FC = () => {
    return (
      <View
        testID={testIdWithKey('CredentialDetailsPrimaryHeader')}
        style={[styles.primaryHeaderContainer, { zIndex: -1 }]}
      >
        <View>
          {overlay.metaOverlay?.watermark && (
            <CardWatermark width={width} height={height} watermark={overlay.metaOverlay?.watermark} />
          )}
          {isBrandindOverlay11 ? (
            <TouchableOpacity
              onPress={navigateToContactDetails}
              style={styles.issuerBranding11Containter}
              accessibilityHint={`${t('CredentialDetails.IssuedBy')} ${overlay.metaOverlay?.issuer}`}
              accessibilityLabel={`${t('CredentialDetails.IssuedBy')}: ${overlay?.metaOverlay?.name}`}
              accessibilityRole={'button'}
            >
              <View style={styles.issuerAndLogoBrangind11Container}>
                <CredentialCardLogo />
                <Text
                  testID={testIdWithKey('CredentialIssuer')}
                  style={[
                    TextTheme.label,
                    styles.textContainer,
                    {
                      flex: 1,
                      flexWrap: 'wrap',
                      marginHorizontal: 8,
                      paddingLeft:
                        bundleResolver.getBrandingOverlayType() == BrandingOverlayType.Branding10
                          ? logoHeight + paddingVertical
                          : 0,

                      lineHeight: 19,
                      opacity: 0.8,
                      color: credentialTextColor(ColorPallet, overlay.brandingOverlay?.secondaryBackgroundColor),
                    },
                  ]}
                >
                  {overlay.metaOverlay?.issuer}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Assets.svg.iconChevronRight
                  width={48}
                  height={48}
                  color={credentialTextColor(ColorPallet, overlay.brandingOverlay?.secondaryBackgroundColor)}
                />
              </View>
            </TouchableOpacity>
          ) : (
            <>
              <Text
                testID={testIdWithKey('CredentialIssuer')}
                style={[
                  TextTheme.label,
                  styles.textContainer,
                  {
                    paddingLeft: logoHeight + paddingVertical,
                    paddingBottom: paddingVertical,
                    lineHeight: 19,
                    opacity: 0.8,
                  },
                ]}
                numberOfLines={1}
              >
                {overlay.metaOverlay?.issuer}
              </Text>
              <Text
                testID={testIdWithKey('CredentialName')}
                style={[
                  TextTheme.normal,
                  styles.textContainer,
                  {
                    lineHeight: 24,
                  },
                ]}
              >
                {overlay.metaOverlay?.name}
              </Text>
            </>
          )}
        </View>
      </View>
    )
  }

  const CredentialDetailSecondaryHeader: React.FC = () => {
    return (
      <>
        {overlay.brandingOverlay?.backgroundImage ? (
          <ImageBackground
            source={toImageSource(overlay.brandingOverlay?.backgroundImage)}
            imageStyle={{
              resizeMode: 'cover',
            }}
          >
            <View testID={testIdWithKey('CredentialDetailsSecondaryHeader')} style={styles.secondaryHeaderContainer} />
          </ImageBackground>
        ) : (
          <View testID={testIdWithKey('CredentialDetailsSecondaryHeader')} style={styles.secondaryHeaderContainer} />
        )}
      </>
    )
  }

  const CredentialRevocationMessage: React.FC<{ credential: CredentialExchangeRecord }> = ({ credential }) => {
    return (
      <InfoBox
        notificationType={InfoBoxType.Error}
        title={t('CredentialDetails.CredentialRevokedMessageTitle') + ' ' + revocationDate}
        description={
          credential?.revocationNotification?.comment
            ? credential.revocationNotification.comment
            : t('CredentialDetails.CredentialRevokedMessageBody')
        }
        onCallToActionLabel={t('Global.Dismiss')}
        onCallToActionPressed={callDismissRevokedMessage}
      />
    )
  }

  const revocationContainer = (
    <View style={{ paddingTop: paddingVertical }}>
      {credential && <CredentialRevocationMessage credential={credential} />}
    </View>
  )

  const header = () => {
    return bundleResolver.getBrandingOverlayType() === BrandingOverlayType.Branding01 ? (
      <View>
        {isRevoked && !isRevokedMessageHidden ? (
          <View style={{ padding: paddingVertical, paddingBottom: 0 }}>
            {credential && <CredentialRevocationMessage credential={credential} />}
          </View>
        ) : null}
        {credential && <CredentialCard credential={credential} style={{ margin: 16 }} />}
      </View>
    ) : (
      <View style={styles.container}>
        <CredentialDetailSecondaryHeader />
        {isBrandindOverlay10 && <CredentialCardLogo />}
        <CredentialDetailPrimaryHeader />
        {isBrandindOverlay11 && (
          <View
            style={{
              backgroundColor: ColorPallet.brand.secondaryBackground,
              paddingHorizontal: 25,
              paddingVertical,
            }}
          >
            <Text
              testID={testIdWithKey('CredentialName')}
              style={[
                TextTheme.normal,
                styles.textContainer,
                {
                  color: ColorPallet.brand.link,
                  lineHeight: 24,
                  marginBottom: 8,
                },
              ]}
            >
              {overlay.metaOverlay?.name}
            </Text>
            <Text
              style={[
                TextTheme.labelSubtitle,
                styles.textContainer,
                {
                  color: ColorPallet.brand.link,
                  lineHeight: 18,
                },
              ]}
            >
              {t('CredentialDetails.IssuedOn', {
                date: credential?.createdAt ? formatTime(credential.createdAt, { includeHour: true }) : '',
              })}
            </Text>
            {isRevoked && !isRevokedMessageHidden && revocationContainer}
          </View>
        )}

        {isBrandindOverlay10 && isRevoked && !isRevokedMessageHidden && revocationContainer}
      </View>
    )
  }

  const footer = () => {
    return (
      <View style={{ marginBottom: 50 }}>
        {credentialConnectionLabel && isBrandindOverlay10 ? (
          <View
            style={{
              backgroundColor: ColorPallet.brand.secondaryBackground,
              marginTop: paddingVertical,
              paddingHorizontal,
              paddingVertical,
            }}
          >
            <Text testID={testIdWithKey('IssuerName')}>
              <Text style={[TextTheme.title, isRevoked && { color: ColorPallet.grayscale.mediumGrey }]}>
                {t('CredentialDetails.IssuedBy') + ' '}
              </Text>
              <Text style={[TextTheme.normal, isRevoked && { color: ColorPallet.grayscale.mediumGrey }]}>
                {credentialConnectionLabel}
              </Text>
            </Text>
          </View>
        ) : null}
        {isRevoked ? (
          <View
            style={{
              backgroundColor: ColorPallet.notification.error,
              marginTop: paddingVertical,
              paddingHorizontal,
              paddingVertical,
            }}
          >
            <Text testID={testIdWithKey('RevokedDate')}>
              <Text style={[TextTheme.title, { color: ColorPallet.notification.errorText }]}>
                {t('CredentialDetails.Revoked') + ': '}
              </Text>
              <Text style={[TextTheme.normal, { color: ColorPallet.notification.errorText }]}>
                {preciseRevocationDate}
              </Text>
            </Text>
            <Text
              style={[TextTheme.normal, { color: ColorPallet.notification.errorText, marginTop: paddingVertical }]}
              testID={testIdWithKey('RevocationMessage')}
            >
              {credential?.revocationNotification?.comment
                ? credential.revocationNotification.comment
                : t('CredentialDetails.CredentialRevokedMessageBody')}
            </Text>
          </View>
        ) : null}
        <RecordRemove onRemove={callOnRemove} />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flexGrow: 1 }} edges={['left', 'right']}>
      <Record fields={overlay.presentationFields || []} hideFieldValues header={header} footer={footer} />
      <CommonRemoveModal
        usage={ModalUsage.CredentialRemove}
        visible={isRemoveModalDisplayed}
        onSubmit={callSubmitRemove}
        onCancel={callCancelRemove}
      />
    </SafeAreaView>
  )
}

export default CredentialDetails
