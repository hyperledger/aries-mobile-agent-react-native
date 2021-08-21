import React, { useEffect } from 'react'

import { SafeAreaScrollView, Label, Text } from 'components'

interface Props {
  navigation: any
  route: any
}

const ContactDetails: React.FC<Props> = ({ navigation, route }) => {
  const { alias, invitation, createdAt, state } = route?.params?.contact

  useEffect(() => {
    navigation.setOptions({
      title: alias,
    })
  }, [])

  return (
    <SafeAreaScrollView>
      <Label title="Created" subtitle={JSON.stringify(createdAt)} />
      <Label title="Connection State" subtitle={state} />
    </SafeAreaScrollView>
  )
}

export default ContactDetails
