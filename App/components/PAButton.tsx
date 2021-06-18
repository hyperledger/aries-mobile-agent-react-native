import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'

interface Props {
  title: string
}

const PAButton: React.FC<Props> = ({ title, ...otherButtonProps }) => {
  return (
    <TouchableOpacity style={styles.button} {...otherButtonProps}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  )
}

export default PAButton

const styles = StyleSheet.create({
  button: {
    borderRadius: 5,
    backgroundColor: '#35823f',
    alignItems: 'center',
    padding: 10,
    margin: 15,
  },
  text: {
    fontSize: 16,
    color: 'white',
  },
})
