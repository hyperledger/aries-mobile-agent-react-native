import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput as TI } from 'react-native'

import { mainColor, textColor, shadow, borderRadius } from '../../globalStyles'

interface Props {
  label: string
  placeholder: string
  maxLength?: number
  keyboardType?: 'numeric'
  autoFocus?: boolean
  secureTextEntry?: boolean
  value: string
  onChangeText: any
}

const TextInput: React.FC<Props> = ({ label, maxLength, placeholder, ...textInputProps }) => {
  const [focused, setFocused] = useState(false)

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TI
        style={[styles.textInput, focused && { borderColor: mainColor, backgroundColor: 'black' }]}
        selectionColor={mainColor}
        maxLength={maxLength}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...textInputProps}
      />
    </View>
  )
}

export default TextInput

const styles = StyleSheet.create({
  container: {
    width: '90%',
    marginVertical: 10,
  },
  label: {
    color: mainColor,
    margin: 2,
  },
  textInput: {
    padding: 10,
    borderRadius,
    fontSize: 16,
    backgroundColor: shadow,
    color: textColor,
    borderWidth: 2,
    borderColor: 'transparent',
  },
})
