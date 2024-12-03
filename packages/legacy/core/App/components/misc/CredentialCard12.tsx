import { BrandingOverlay } from '@hyperledger/aries-oca'
import { Attribute, CredentialOverlay, Predicate } from '@hyperledger/aries-oca/build/legacy'
import { useNavigation } from '@react-navigation/native'
import startCase from 'lodash.startcase'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ImageBackground, Linking, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { TOKENS, useServices } from '../../container-api'
import { useTheme } from '../../contexts/theme'
import { GenericFn } from '../../types/fn'
import { credentialTextColor, toImageSource } from '../../utils/credential'
import { formatIfDate } from '../../utils/helpers'
import { testIdWithKey } from '../../utils/testable'

import CardWatermark from './CardWatermark'
import CredentialActionFooter from './CredentialCard11ActionFooter'
import { backgroundColorIfErrorState, fontColorWithHighContrast } from '../../utils/brandingColors'
import { CredentialCard11And12Theme } from '../../theme'
import { useCredentialRevoked } from '../../hooks/credential-revoked'
import { useProofRevoked } from '../../hooks/proof-revoked'
import { useCardData } from '../../hooks/card-data'
import { useParseAttribute } from '../../hooks/parse-attribute'
import { useCredentialPI } from '../../hooks/credential-private-info'
import { useFlaggedAttributes } from '../../hooks/flagged-attributes'
import { useCredentialCardParams } from '../../hooks/credential-card-params'
import { useBranding } from '../../hooks/bundle-resolver'
import AttributeValue from './AttributeValue'
import CredentialRevokedOrNotAvailable from './CredentialRevokedOrNotAvailable'
import { CredentialCardBrandingProps } from './CredentialCard11'
import CredentialCardLogoBranding from './CredentialCardLogoBranding'
import CredentialCardStatus from './CredentialCardStatus'

/*
  A card is defined as a nx8 (height/rows x width/columns) grid.
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
  | 2 |   |   |   |   |   |   |   |
  | 3 |   |   |   |   |   |   |   |
  | 4 |   |   |   |   |   |   |   |
  ...

  The card width is the full screen width.

  Secondary Body (1):
  Primary Body   (2): 
                      Credential Name (1x6)
                      Primary Attribute 1 (1x6)
                      Primary Attribute 2 (1x6)
                      Small Logo (1x1) + Issuer Name -> (Max width %80, aligned )
  Status         (3): Icon (1x1) -> S

   (1)            (2)           (3)
  |   | Credential Name        | S |
  |   |                        |   |
  |   | Primary Attribute 1    |   |
  |   | Primary Attribute 2    |   |
  |   |                        |   |
  |   |          Logo + Issuer |   |
  ...

  Note: The small logo MUST be provided as 1x1 (height/width) ratio.
 */

const CredentialCard12: React.FC<CredentialCardBrandingProps> = ({
  credential,
  style = {},
  displayItems,
  onPress = undefined,
  error = false,
  predicateError = false,
  elevated = false,
  credName,
  credDefId,
  schemaId,
  proof,
  hasAltCredentials,
  handleAltCredChange,
}) => {
  const { width } = useWindowDimensions()
  const borderRadius = 10
  const padding = 16
  const logoWidth = width * 0.12
  const [dimensions, setDimensions] = useState({ cardWidth: 0, cardHeight: 0 })
  const { t } = useTranslation()
  const { ColorPallet, TextTheme, ListItems } = useTheme()
  const { isRevoked } = useCredentialRevoked(credential, proof)
  const { isProofRevoked } = useProofRevoked(credential, proof)
  const { flaggedAttributes } = useFlaggedAttributes(credential, schemaId, credDefId, proof, credName)
  const { allPI } = useCredentialPI(credential, schemaId, credDefId, proof, credName, displayItems)
  const params = useCredentialCardParams(credential, schemaId, credDefId, proof, credName)
  const { overlay } = useBranding<CredentialOverlay<BrandingOverlay>>(params)
  const [credHelpActionOverrides] = useServices([TOKENS.CRED_HELP_ACTION_OVERRIDES])
  const [helpAction, setHelpAction] = useState<GenericFn>()

  const cardData = useCardData(credential, schemaId, credDefId, proof, credName, displayItems)

  const navigation = useNavigation()

  const getSecondaryBackgroundColor = () => {
    return overlay.brandingOverlay?.backgroundImageSlice
      ? 'rgba(0, 0, 0, 0)'
      : overlay.brandingOverlay?.secondaryBackgroundColor
  }

  const styles = StyleSheet.create({
    container: {
      ...CredentialCard11And12Theme.container,
      backgroundColor: overlay.brandingOverlay?.primaryBackgroundColor,
    },
    cardContainer: {
      ...CredentialCard11And12Theme.cardContainer,
      minHeight: 0.33 * width,
    },
    secondaryBodyContainer: {
      ...CredentialCard11And12Theme.secondaryBodyContainer,
      width: logoWidth,
      backgroundColor: getSecondaryBackgroundColor() ?? overlay.brandingOverlay?.primaryBackgroundColor,
    },
    primaryBodyContainer: {
      ...CredentialCard11And12Theme.primaryBodyContainer,
      padding,
      justifyContent: 'space-between',
    },
    imageAttr: {
      ...CredentialCard11And12Theme.imageAttr,
    },
    statusContainer: {
      ...CredentialCard11And12Theme.statusContainer,
      height: logoWidth,
      width: logoWidth,
    },
    logoContainer: {
      width: logoWidth,
      height: logoWidth,
      ...CredentialCard11And12Theme.logoContainer,
    },
    headerText: {
      ...CredentialCard11And12Theme.headerText,
    },
    valueText: {
      ...CredentialCard11And12Theme.valueText,
    },
    textContainer: {
      color: proof
        ? TextTheme.normal.color
        : credentialTextColor(ColorPallet, overlay.brandingOverlay?.primaryBackgroundColor),
      ...CredentialCard11And12Theme.textContainer,
    },
    errorText: {
      ...CredentialCard11And12Theme.errorText,
    },
    errorIcon: {
      ...CredentialCard11And12Theme.errorIcon,
    },
    selectedCred: {
      ...CredentialCard11And12Theme.selectedCred,
    },
    seperator: {
      ...CredentialCard11And12Theme.seperator,
    },
    credActionText: {
      ...CredentialCard11And12Theme.credActionText,
    },
  })

  const parseAttribute = useParseAttribute(credential, schemaId, credDefId, proof, credName)

  useEffect(() => {
    if (proof) {
      const credHelpUrl =
        overlay.bundle?.metadata?.credentialSupportUrl?.[params.language] ??
        overlay.bundle?.metadata.credentialSupportUrl?.[0]

      // Check if there is a help action override for this credential
      const override = credHelpActionOverrides?.find(
        (override) =>
          (credDefId && override.credDefIds.includes(credDefId)) || (schemaId && override.schemaIds.includes(schemaId))
      )
      if (override) {
        setHelpAction(() => () => {
          override.action(navigation)
        })
      } else if (credHelpUrl) {
        setHelpAction(() => () => {
          Linking.openURL(credHelpUrl)
        })
      }
    }
  }, [proof, overlay, schemaId, credDefId, params.language, credHelpActionOverrides, navigation])

  const AttributeLabel: React.FC<{ label: string }> = ({ label }) => {
    const ylabel = overlay.bundle?.labelOverlay?.attributeLabels[label] ?? startCase(label)
    const labelColor = proof
      ? overlay.brandingOverlay?.secondaryBackgroundColor
      : overlay.brandingOverlay?.primaryBackgroundColor
    return (
      <Text
        style={[
          TextTheme.labelSubtitle,
          styles.textContainer,
          {
            fontWeight: '600',
            lineHeight: 18,
            opacity: 0.7,
            color:
              error || isProofRevoked
                ? backgroundColorIfErrorState(
                    ColorPallet,
                    error,
                    predicateError,
                    isProofRevoked,
                    styles.secondaryBodyContainer.backgroundColor
                  )
                : credentialTextColor(ColorPallet, labelColor),
          },
        ]}
        testID={testIdWithKey('AttributeName')}
      >
        {ylabel}
      </Text>
    )
  }

  const renderCardAttribute = (item: Attribute & Predicate) => {
    const { label, value } = parseAttribute(item)
    const parsedValue = formatIfDate(item?.format, value) ?? ''
    const warn = flaggedAttributes?.includes(label) && !item.pValue && proof
    return (
      <View style={{ marginBottom: item ? 16 : 0, gap: 4 }}>
        {item && (
          <>
            <AttributeLabel label={label} />
            {!(item?.value || item?.pValue) ? null : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {flaggedAttributes?.includes(label) && !item.pValue && !allPI && proof && (
                  <Icon
                    style={{ paddingTop: 2, paddingHorizontal: 2 }}
                    name="warning"
                    color={ColorPallet.notification.warnIcon}
                    size={ListItems.recordAttributeText.fontSize}
                  />
                )}
                {!error ? (
                  <AttributeValue
                    value={parsedValue}
                    styles={[
                      styles.textContainer,
                      {
                        fontSize: 16,
                        lineHeight: 24,
                      },
                      {
                        color: warn ? ColorPallet.notification.warnText : styles.textContainer.color,
                      },
                    ]}
                  />
                ) : null}
              </View>
            )}
            {!error && item?.satisfied != undefined && item?.satisfied === false ? (
              <Text style={styles.errorText} numberOfLines={1}>
                {t('ProofRequest.PredicateNotSatisfied')}
              </Text>
            ) : null}
          </>
        )}
      </View>
    )
  }

  const CredentialCardPrimaryBody: React.FC = () => {
    return (
      <View testID={testIdWithKey('CredentialCardPrimaryBody')} style={[styles.primaryBodyContainer, style]}>
        <View style={{ flexDirection: 'row', marginBottom: 19 }}>
          <Text
            testID={testIdWithKey('CredentialName')}
            style={[
              TextTheme.normal,
              styles.textContainer,
              {
                fontSize: 14,
                fontWeight: '600',
                lineHeight: 16,
                flex: 1,
                maxWidth: '85%',
                flexWrap: 'wrap',
                color: allPI && proof ? ColorPallet.notification.warnText : styles.textContainer.color,
              },
            ]}
          >
            {overlay.metaOverlay?.name}
          </Text>
        </View>
        {(error || isProofRevoked) && (
          <CredentialRevokedOrNotAvailable
            message={error ? t('ProofRequest.NotAvailableInYourWallet') : t('CredentialDetails.Revoked')}
          />
        )}
        <FlatList
          data={cardData}
          scrollEnabled={false}
          initialNumToRender={cardData?.length}
          renderItem={({ item }) => {
            return renderCardAttribute(item as Attribute & Predicate)
          }}
          ListFooterComponent={
            hasAltCredentials && handleAltCredChange ? (
              <View style={{ marginBottom: 16 }}>
                <CredentialActionFooter
                  onPress={handleAltCredChange}
                  text={t('ProofRequest.ChangeCredential')}
                  testID={'ChangeCredential'}
                />
              </View>
            ) : error && helpAction ? (
              <CredentialActionFooter
                onPress={helpAction}
                text={t('ProofRequest.GetThisCredential')}
                testID={'GetThisCredential'}
              />
            ) : null
          }
        />
        {!(overlay.metaOverlay?.issuer === 'Unknown Contact' && proof) && (
          <View
            style={{
              flex: 1,
              alignSelf: 'flex-end',
              justifyContent: 'flex-end',
              maxWidth: '80%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignSelf: 'flex-end',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <CredentialCardLogoBranding
                credential={credential}
                credName={credName}
                credDefId={credDefId}
                schemaId={schemaId}
                proof={proof}
                logoContainerStyles={styles.logoContainer}
              />
              <Text
                testID={testIdWithKey('CredentialIssuer')}
                style={[
                  TextTheme.normal,
                  styles.textContainer,
                  {
                    fontWeight: '500',
                    fontSize: 12,
                    lineHeight: 19,
                    opacity: 0.8,
                    flexWrap: 'wrap',
                  },
                ]}
              >
                {overlay.metaOverlay?.issuer}
              </Text>
            </View>
          </View>
        )}
      </View>
    )
  }

  const CredentialCardSecondaryBody: React.FC = () => {
    return (
      <View
        testID={testIdWithKey('CredentialCardSecondaryBody')}
        style={[
          styles.secondaryBodyContainer,
          {
            backgroundColor: backgroundColorIfErrorState(
              ColorPallet,
              error,
              predicateError,
              isProofRevoked,
              styles.secondaryBodyContainer.backgroundColor
            ),
            overflow: 'hidden',
          },
        ]}
      >
        {overlay.brandingOverlay?.backgroundImageSlice && !displayItems ? (
          <ImageBackground
            source={toImageSource(overlay.brandingOverlay?.backgroundImageSlice)}
            style={{ flexGrow: 1 }}
            imageStyle={{
              borderTopLeftRadius: borderRadius,
              borderBottomLeftRadius: borderRadius,
            }}
          />
        ) : (
          !(error || predicateError || proof || getSecondaryBackgroundColor()) && (
            <View
              style={[
                {
                  backgroundColor: 'rgba(0,0,0,0.24)',
                  borderTopLeftRadius: borderRadius,
                  borderBottomLeftRadius: borderRadius,
                  position: 'absolute',
                  width: logoWidth,
                  height: '100%',
                },
              ]}
            />
          )
        )}
      </View>
    )
  }

  const CredentialCard: React.FC<{ status?: 'error' | 'warn' }> = ({ status }) => {
    return (
      <View
        accessible={true}
        accessibilityLabel={
          `${overlay.metaOverlay?.issuer ? `${t('Credentials.IssuedBy')} ${overlay.metaOverlay?.issuer}` : ''}, ${
            overlay.metaOverlay?.watermark ?? ''
          } ${overlay.metaOverlay?.name ?? ''} ${t('Credentials.Credential')}.` +
          cardData.map((item) => {
            const { label, value } = parseAttribute(item as (Attribute & Predicate) | undefined)
            if (label && value) return ` ${label}, ${value}`
          })
        }
        style={styles.cardContainer}
      >
        <CredentialCardSecondaryBody />
        <CredentialCardPrimaryBody />
        <CredentialCardStatus status={status} />
      </View>
    )
  }
  return overlay.bundle ? (
    <View
      onLayout={(event) => {
        setDimensions({ cardHeight: event.nativeEvent.layout.height, cardWidth: event.nativeEvent.layout.width })
      }}
      style={[
        styles.container,
        style,
        { elevation: elevated ? 5 : 0, overflow: 'hidden' },
        hasAltCredentials ? styles.selectedCred : undefined,
      ]}
    >
      <TouchableOpacity
        accessibilityLabel={typeof onPress === 'undefined' ? undefined : t('Credentials.CredentialDetails')}
        accessible={false}
        disabled={typeof onPress === 'undefined'}
        onPress={onPress}
        style={[styles.container, style, { backgroundColor: style.backgroundColor }]}
        testID={testIdWithKey('ShowCredentialDetails')}
      >
        <View testID={testIdWithKey('CredentialCard')}>
          {overlay.metaOverlay?.watermark && (
            <CardWatermark
              width={dimensions.cardWidth}
              height={dimensions.cardHeight}
              style={{
                color: fontColorWithHighContrast(
                  ColorPallet,
                  error,
                  predicateError,
                  isProofRevoked,
                  overlay.brandingOverlay?.primaryBackgroundColor,
                  proof
                ),
              }}
              watermark={overlay.metaOverlay?.watermark}
            />
          )}
          <CredentialCard status={isRevoked ? 'error' : allPI && proof ? 'warn' : undefined} />
        </View>
      </TouchableOpacity>
    </View>
  ) : null
}

export default CredentialCard12
