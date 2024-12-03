import React, { useEffect, useRef } from 'react'
import { StyleProp, ViewStyle, View, StyleSheet, Animated, useWindowDimensions } from 'react-native'

import { useTheme } from '../../contexts/theme'
import { testIdWithKey } from '../../utils/testable'
import { TOKENS, useServices } from '../../container-api'
import { BrandingOverlayType } from '@hyperledger/aries-oca/build/legacy'

type RecordLoadingProps = {
  style?: StyleProp<ViewStyle>
}

const fadeTiming: Animated.TimingAnimationConfig = {
  toValue: 0.4,
  duration: 1100,
  useNativeDriver: true,
}

const borderRadius = 10

const RecordLoading: React.FC<RecordLoadingProps> = ({ style }) => {
  const { width } = useWindowDimensions()
  const padding = width * 0.05
  const logoHeight = width * 0.12
  const { ColorPallet } = useTheme()
  const [bundleResolver] = useServices([TOKENS.UTIL_OCA_RESOLVER])
  const rowFadeAnim = useRef(new Animated.Value(1))
  const myStyle = StyleSheet.create({
    container: {
      flexDirection: 'column',
    },
    rectangle: {
      backgroundColor: ColorPallet.grayscale.lightGrey,
      height: 30,
      marginVertical: 5,
      borderRadius,
    },
    margin: {
      backgroundColor: ColorPallet.grayscale.lightGrey,
      width: 40,
      borderTopLeftRadius: borderRadius,
      borderBottomLeftRadius: borderRadius,
    },
    logo: {
      backgroundColor: ColorPallet.grayscale.lightGrey,
      height: logoHeight,
      width: logoHeight,
      borderRadius,
    },
    logoFloating: {
      marginLeft: -1 * logoHeight + padding,
      marginTop: padding,
    },
    logoWithIssuerContainer: {
      flexDirection: 'row',
      maxWidth: '70%',
      gap: 4,
      alignSelf: 'flex-end',
      marginTop: 15,
    },
  })

  useEffect(() => {
    Animated.loop(Animated.timing(rowFadeAnim.current, fadeTiming)).start()
  }, [])

  return (
    <Animated.View
      style={[{ opacity: rowFadeAnim.current, backgroundColor: ColorPallet.grayscale.white, borderRadius: 15 }, style]}
    >
      <View style={myStyle.container} testID={testIdWithKey('RecordLoading')}>
        <View style={{ flexDirection: 'row' }}>
          <View style={myStyle.margin} />
          {bundleResolver.getBrandingOverlayType() !== BrandingOverlayType.Branding11 && (
            <View style={[myStyle.logo, myStyle.logoFloating]} />
          )}
          <View style={{ flexGrow: 1, margin: 15 }}>
            <View style={[myStyle.rectangle, { width: '100%', height: 20 }]} />
            <View style={[myStyle.rectangle, { width: '75%', height: 25 }]} />
            <View style={[myStyle.rectangle, { width: '35%', height: 20, marginTop: 20 }]} />
            <View style={[myStyle.rectangle, { width: '90%', height: 25 }]} />
            {bundleResolver.getBrandingOverlayType() === BrandingOverlayType.Branding11 && (
              <View style={myStyle.logoWithIssuerContainer}>
                <View style={myStyle.logo} />
                <View style={[myStyle.rectangle, { width: '75%', height: logoHeight, marginVertical: 0 }]} />
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  )
}

export default RecordLoading
