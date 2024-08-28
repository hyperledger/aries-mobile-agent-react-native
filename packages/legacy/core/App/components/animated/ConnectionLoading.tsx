import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'

import ActivityIndicator from '../../assets/img/activity-indicator-circle.svg'
import Wallet from '../../assets/img/wallet.svg'
import { useTheme } from '../../contexts/theme'

const timing: Animated.TimingAnimationConfig = {
  toValue: 1,
  duration: 2000,
  useNativeDriver: true,
}

const ConnectionLoading: React.FC = () => {
  const { ColorPallet } = useTheme()
  const rotationAnim = useRef(new Animated.Value(0))
  const rotation = rotationAnim.current.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })
  const style = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    animation: {
      position: 'absolute',
    },
  })
  const credentialInHandDisplayOptions = {
    fill: ColorPallet.notification.infoText,
    height: 130,
    width: 130,
  }
  const animatedCircleDisplayOptions = {
    fill: ColorPallet.notification.infoText,
    height: 250,
    width: 250,
  }

  useEffect(() => {
    Animated.loop(Animated.timing(rotationAnim.current, timing)).start()
  }, [])

  return (
    <View style={style.container}>
      <Wallet style={style.animation} {...credentialInHandDisplayOptions} />
      <Animated.View style={{ transform: [{ rotate: rotation }] }}>
        <ActivityIndicator {...animatedCircleDisplayOptions} />
      </Animated.View>
    </View>
  )
}

export default ConnectionLoading
