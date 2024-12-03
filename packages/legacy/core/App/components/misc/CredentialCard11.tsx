import { CredentialExchangeRecord } from '@credo-ts/core'
import { BrandingOverlay } from '@hyperledger/aries-oca'
import { Attribute, CredentialOverlay, Predicate } from '@hyperledger/aries-oca/build/legacy'
import { useNavigation } from '@react-navigation/native'
import startCase from 'lodash.startcase'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FlatList,
  Image,
  ImageBackground,
  Linking,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Icon from 'react-native-vector-icons/MaterialIcons'

import { TOKENS, useServices } from '../../container-api'
import { useTheme } from '../../contexts/theme'
import { GenericFn } from '../../types/fn'
import { credentialTextColor, getCredentialIdentifiers, toImageSource } from '../../utils/credential'
import { formatIfDate, useCredentialConnectionLabel, isDataUrl } from '../../utils/helpers'
import { shadeIsLightOrDark, Shade } from '../../utils/luminance'
import { testIdWithKey } from '../../utils/testable'

import CardWatermark from './CardWatermark'
import CredentialActionFooter from './CredentialCard11ActionFooter'
import { CredentialCard11And12Theme } from '../../theme'
import { useParseAttribute } from '../../hooks/parse-attribute'
import CredentialCardLogoBranding from './CredentialCardLogoBranding'
import CredentialCardStatus from './CredentialCardStatus'

export interface CredentialCardBrandingProps {
  credential?: CredentialExchangeRecord
  onPress?: GenericFn
  style?: ViewStyle
  displayItems?: (Attribute | Predicate)[]
  revoked?: boolean
  error?: boolean
  predicateError?: boolean
  elevated?: boolean
  credName?: string
  credDefId?: string
  schemaId?: string
  proof?: boolean
  hasAltCredentials?: boolean
  handleAltCredChange?: () => void
}

/*
  A card is defined as a nx8 (height/rows x width/columns) grid.
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
  | 2 |   |   |   |   |   |   |   |
  | 3 |   |   |   |   |   |   |   |
  | 4 |   |   |   |   |   |   |   |
  ...

  The card width is the full screen width.

  Secondary Body (1):
  Primary Body   (2): Small Logo (1x1) -> L (shifted left by 50%)
                      Issuer Name (1x6)
                      Credential Name (1x6)
                      Primary Attribute 1 (1x6)
                      Primary Attribute 2 (1x6)
  Status         (3): Icon (1x1) -> S

   (1)            (2)           (3)
  | L | Issuer Name            | S |
  |   | Credential Name        |   |
  |   |                        |   |
  |   | Primary Attribute 1    |   |
  |   | Primary Attribute 2    |   |
  ...

  Note: The small logo MUST be provided as 1x1 (height/width) ratio.
 */

const CredentialCard11: React.FC<CredentialCardBrandingProps> = ({
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
  const padding = width * 0.05
  const logoHeight = width * 0.12
  const [dimensions, setDimensions] = useState({ cardWidth: 0, cardHeight: 0 })
  const { i18n, t } = useTranslation()
  const { ColorPallet, TextTheme, ListItems } = useTheme()
  const [isRevoked, setIsRevoked] = useState<boolean>(credential?.revocationNotification !== undefined)
  const [flaggedAttributes, setFlaggedAttributes] = useState<string[]>()
  const [allPI, setAllPI] = useState<boolean>()
  const credentialConnectionLabel = useCredentialConnectionLabel(credential)
  const [isProofRevoked, setIsProofRevoked] = useState<boolean>(
    credential?.revocationNotification !== undefined && !!proof
  )
  const [bundleResolver, credHelpActionOverrides] = useServices([
    TOKENS.UTIL_OCA_RESOLVER,
    TOKENS.CRED_HELP_ACTION_OVERRIDES,
  ])
  const [helpAction, setHelpAction] = useState<GenericFn>()
  const [overlay, setOverlay] = useState<CredentialOverlay<BrandingOverlay>>({})

  const cardData = useMemo(() => {
    const primaryField = overlay?.presentationFields?.find(
      (field) => field.name === overlay?.brandingOverlay?.primaryAttribute
    )
    const secondaryField = overlay?.presentationFields?.find(
      (field) => field.name === overlay?.brandingOverlay?.secondaryAttribute
    )
    return [...(displayItems ?? []), primaryField, secondaryField]
  }, [displayItems, overlay])

  const navigation = useNavigation()

  const getSecondaryBackgroundColor = () => {
    if (proof) {
      return overlay.brandingOverlay?.primaryBackgroundColor
    } else {
      return overlay.brandingOverlay?.backgroundImageSlice
        ? 'rgba(0, 0, 0, 0)'
        : overlay.brandingOverlay?.secondaryBackgroundColor
    }
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
      width: logoHeight,
      ...CredentialCard11And12Theme.secondaryBodyContainer,
      backgroundColor: getSecondaryBackgroundColor() ?? overlay.brandingOverlay?.primaryBackgroundColor,
    },
    primaryBodyContainer: {
      ...CredentialCard11And12Theme.primaryBodyContainer,
      padding,
      marginLeft: -1 * logoHeight + padding,
    },
    imageAttr: {
      ...CredentialCard11And12Theme.imageAttr,
    },
    statusContainer: {
      ...CredentialCard11And12Theme.statusContainer,
      height: logoHeight,
      width: logoHeight,
    },
    logoContainer: {
      top: padding,
      left: -1 * logoHeight + padding,
      width: logoHeight,
      height: logoHeight,
      ...CredentialCard11And12Theme.logoContainer,
      shadowColor: '#000',
      shadowOffset: {
        width: 1,
        height: 1,
      },
      shadowOpacity: 0.3,
      ...(elevated
        ? {
            elevation: 5,
          }
        : { elevation: 0 }),
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
    credActionText: {
      ...CredentialCard11And12Theme.credActionText,
    },
  })

  const backgroundColorIfRevoked = (backgroundColor?: string) =>
    isProofRevoked ? ColorPallet.notification.errorBorder : backgroundColor

  const fontColorWithHighContrast = () => {
    if (proof) {
      return ColorPallet.grayscale.mediumGrey
    }

    const c =
      backgroundColorIfRevoked(overlay.brandingOverlay?.primaryBackgroundColor) ?? ColorPallet.grayscale.lightGrey
    const shade = shadeIsLightOrDark(c)

    return shade == Shade.Light ? ColorPallet.grayscale.darkGrey : ColorPallet.grayscale.lightGrey
  }

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
  }, [credential, cardData, parseAttribute, flaggedAttributes])

  useEffect(() => {
    const params = {
      identifiers: credential ? getCredentialIdentifiers(credential) : { schemaId, credentialDefinitionId: credDefId },
      attributes: proof ? [] : credential?.credentialAttributes,
      meta: {
        credName,
        credConnectionId: credential?.connectionId,
        alias: credentialConnectionLabel,
      },
      language: i18n.language,
    }
    bundleResolver.resolveAllBundles(params).then((bundle: any) => {
      if (proof) {
        setFlaggedAttributes((bundle as any).bundle.bundle.flaggedAttributes.map((attr: any) => attr.name))
        const credHelpUrl =
          (bundle as any).bundle.bundle.metadata.credentialSupportUrl[params.language] ??
          Object.values((bundle as any).bundle.bundle.metadata.credentialSupportUrl)?.[0]

        // Check if there is a help action override for this credential
        const override = credHelpActionOverrides?.find(
          (override) =>
            (credDefId && override.credDefIds.includes(credDefId)) ||
            (schemaId && override.schemaIds.includes(schemaId))
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
      setOverlay((o) => ({
        ...o,
        ...bundle,
        brandingOverlay: bundle.brandingOverlay as BrandingOverlay,
      }))
    })
  }, [
    credential,
    schemaId,
    credDefId,
    credName,
    credentialConnectionLabel,
    i18n.language,
    bundleResolver,
    proof,
    credHelpActionOverrides,
    navigation,
  ])

  useEffect(() => {
    setIsRevoked(credential?.revocationNotification !== undefined && !proof)
    setIsProofRevoked(credential?.revocationNotification !== undefined && !!proof)
  }, [credential?.revocationNotification, proof])

  const AttributeLabel: React.FC<{ label: string }> = ({ label }) => {
    const ylabel = overlay.bundle?.labelOverlay?.attributeLabels[label] ?? startCase(label)
    return (
      <Text
        style={[
          TextTheme.labelSubtitle,
          styles.textContainer,
          {
            lineHeight: 19,
            opacity: 0.8,
          },
        ]}
        testID={testIdWithKey('AttributeName')}
      >
        {ylabel}
      </Text>
    )
  }

  const AttributeErrorLabel: React.FC<{ errorMessage: string }> = ({ errorMessage }) => {
    return (
      <Text
        style={[
          TextTheme.labelSubtitle,
          styles.textContainer,
          {
            lineHeight: 19,
            opacity: 0.8,
            color: ListItems.proofError.color,
          },
        ]}
      >
        {errorMessage}
      </Text>
    )
  }

  const AttributeValue: React.FC<{ value: string | number | null; warn?: boolean }> = ({ value, warn }) => {
    return (
      <>
        {isDataUrl(value) ? (
          <Image style={styles.imageAttr} source={{ uri: value as string }} />
        ) : (
          <Text
            style={[
              TextTheme.bold,
              styles.textContainer,
              {
                lineHeight: 24,
              },
              { color: warn ? ColorPallet.notification.warnText : styles.textContainer.color },
            ]}
            testID={testIdWithKey('AttributeValue')}
          >
            {value}
          </Text>
        )}
      </>
    )
  }

  const renderCardAttribute = (item: Attribute & Predicate) => {
    const { label, value } = parseAttribute(item)
    const parsedValue = formatIfDate(item?.format, value) ?? ''
    return (
      item && (
        <View style={{ marginTop: 15 }}>
          {!(item?.value || item?.satisfied) ? (
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AttributeLabel label={label} />
              </View>
              {item.hasError && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon
                    style={{ paddingTop: 2, paddingHorizontal: 2 }}
                    name="close"
                    color={ListItems.proofError.color}
                    size={ListItems.recordAttributeText.fontSize}
                  />
                  <AttributeErrorLabel
                    errorMessage={t('ProofRequest.MissingAttribute', {
                      name: overlay.bundle?.labelOverlay?.attributeLabels[label] ?? startCase(label),
                    })}
                  />
                </View>
              )}
            </View>
          ) : (
            <AttributeLabel label={label} />
          )}
          {/* Rendering attribute values */}
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
              <AttributeValue warn={flaggedAttributes?.includes(label) && !item.pValue && proof} value={parsedValue} />
            </View>
          )}
          {!error && item?.satisfied != undefined && item?.satisfied === false ? (
            <Text style={styles.errorText} numberOfLines={1}>
              {t('ProofRequest.PredicateNotSatisfied')}
            </Text>
          ) : null}
        </View>
      )
    )
  }

  const CredentialCardPrimaryBody: React.FC = () => {
    return (
      <View testID={testIdWithKey('CredentialCardPrimaryBody')} style={styles.primaryBodyContainer}>
        <View>
          {!(overlay.metaOverlay?.issuer === 'Unknown Contact' && proof) && (
            <View style={{ flexDirection: 'row' }}>
              <Text
                testID={testIdWithKey('CredentialIssuer')}
                style={[
                  TextTheme.label,
                  styles.textContainer,
                  {
                    lineHeight: 19,
                    opacity: 0.8,
                    flex: 1,
                    flexWrap: 'wrap',
                  },
                ]}
              >
                {overlay.metaOverlay?.issuer}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row' }}>
            <Text
              testID={testIdWithKey('CredentialName')}
              style={[
                TextTheme.bold,
                styles.textContainer,
                {
                  lineHeight: 24,
                  flex: 1,
                  flexWrap: 'wrap',
                  color: allPI && proof ? ColorPallet.notification.warnText : styles.textContainer.color,
                },
              ]}
            >
              {overlay.metaOverlay?.name}
            </Text>
          </View>
        </View>
        {isProofRevoked && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon style={styles.errorIcon} name="close" size={30} />

            <Text style={styles.errorText} testID={testIdWithKey('RevokedOrNotAvailable')} numberOfLines={1}>
              {t('CredentialDetails.Revoked')}
            </Text>
          </View>
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
              <CredentialActionFooter
                onPress={handleAltCredChange}
                text={t('ProofRequest.ChangeCredential')}
                testID={'ChangeCredential'}
              />
            ) : error && helpAction ? (
              <CredentialActionFooter
                onPress={helpAction}
                text={t('ProofRequest.GetThisCredential')}
                testID={'GetThisCredential'}
              />
            ) : null
          }
        />
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
            backgroundColor: backgroundColorIfRevoked(styles.secondaryBodyContainer.backgroundColor),
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
                  position: 'absolute',
                  width: logoHeight,
                  height: '100%',
                  borderTopLeftRadius: borderRadius,
                  borderBottomLeftRadius: borderRadius,
                  backgroundColor: 'rgba(0,0,0,0.24)',
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
        style={styles.cardContainer}
        accessible={true}
        accessibilityLabel={
          `${overlay.metaOverlay?.issuer ? `${t('Credentials.IssuedBy')} ${overlay.metaOverlay?.issuer}` : ''}, ${
            overlay.metaOverlay?.watermark ?? ''
          } ${overlay.metaOverlay?.name ?? ''} ${t('Credentials.Credential')}.` +
          cardData.map((item) => {
            const { label, value } = parseAttribute(item as (Attribute & Predicate) | undefined)
            if (label && value) {
              return ` ${label}, ${value}`
            }
          })
        }
      >
        <CredentialCardSecondaryBody />
        <CredentialCardLogoBranding
          credential={credential}
          credName={credName}
          credDefId={credDefId}
          schemaId={schemaId}
          proof={proof}
          logoContainerStyles={styles.logoContainer}
        />
        <CredentialCardPrimaryBody />
        <CredentialCardStatus status={status} />
      </View>
    )
  }
  return overlay.bundle ? (
    <View
      style={[
        styles.container,
        style,
        { elevation: elevated ? 5 : 0, overflow: 'hidden' },
        hasAltCredentials ? styles.selectedCred : undefined,
      ]}
      onLayout={(event) => {
        setDimensions({ cardHeight: event.nativeEvent.layout.height, cardWidth: event.nativeEvent.layout.width })
      }}
    >
      <TouchableOpacity
        accessible={false}
        accessibilityLabel={typeof onPress === 'undefined' ? undefined : t('Credentials.CredentialDetails')}
        disabled={typeof onPress === 'undefined' ? true : false}
        onPress={onPress}
        style={[
          styles.container,
          style,
          { backgroundColor: isProofRevoked ? ColorPallet.notification.error : style.backgroundColor },
        ]}
        testID={testIdWithKey('ShowCredentialDetails')}
      >
        <View testID={testIdWithKey('CredentialCard')}>
          {overlay.metaOverlay?.watermark && (
            <CardWatermark
              width={dimensions.cardWidth}
              height={dimensions.cardHeight}
              style={{ color: fontColorWithHighContrast() }}
              watermark={overlay.metaOverlay?.watermark}
            />
          )}
          <CredentialCard status={isRevoked ? 'error' : allPI && proof ? 'warn' : undefined} />
        </View>
      </TouchableOpacity>
    </View>
  ) : null
}

export default CredentialCard11
