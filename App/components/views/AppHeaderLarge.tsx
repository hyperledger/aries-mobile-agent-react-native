import React from 'react'
import { Image, View, StyleSheet } from 'react-native'

import Images from '../../../assets/images'

interface Props {}

const AppHeaderLarge: React.FC<Props> = () => {
  return (
    <View style={styles.headerLarge}>
      <Image source={Images.logoLarge} />
    </View>
  )
}

export default AppHeaderLarge

const styles = StyleSheet.create({
  headerLarge: {
    alignItems: 'center',
    marginVertical: 20,
  },
})
