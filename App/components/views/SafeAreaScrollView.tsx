import React from 'react'
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native'

import { backgroundColor } from '../../globalStyles'

interface Props {
  children: React.ReactNode
}

const SafeAreaScrollView: React.FC<Props> = ({ children }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>{children}</ScrollView>
    </SafeAreaView>
  )
}

export default SafeAreaScrollView

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor,
  },
  scrollView: {
    alignItems: 'center',
  },
})
