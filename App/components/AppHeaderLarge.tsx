import React from 'react'
import { Image, View, StyleSheet } from 'react-native'

import Images from '../../assets/images'

interface IAppHeaderLarge {}

function AppHeaderLarge() {
  return (
    <View style={styles.headerLarge}>
      <Image source={Images.logoLarge} />
    </View>
  )
}

export default AppHeaderLarge

const styles = StyleSheet.create({
  headerLarge: {
    height: '40%',
    alignItems: 'center',
    margin: 40,
  },
})
