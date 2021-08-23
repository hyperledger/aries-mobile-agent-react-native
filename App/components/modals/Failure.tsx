import React from 'react'

import Message from './Message'

interface Props {
  visible: boolean
  message?: string
  onPress?: () => void
}

const Failure: React.FC<Props> = ({ visible, message, onPress }) => {
  return (
    <Message
      visible={visible}
      banner="Failure"
      message={message}
      icon="cancel"
      backgroundColor="#de3333"
      onPress={onPress}
    />
  )
}

export default Failure
