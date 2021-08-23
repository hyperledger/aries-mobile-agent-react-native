import React, { useEffect } from 'react'

import { SafeAreaScrollView, Text, Label } from 'components'

interface Props {
  navigation: any
  route: any
}

const CredentialDetails: React.FC<Props> = ({ navigation, route }) => {
  const { credential } = route?.params?.credential

  const {
    attributes: { first_name, last_name, gender, age },
  } = credential

  useEffect(() => {
    navigation.setOptions({
      title: route?.params?.alias,
    })
  }, [])

  return (
    <SafeAreaScrollView>
      <Text>{first_name}</Text>
      <Text>{last_name}</Text>
      <Label title="Gender" subtitle={gender} />
      <Label title="Age" subtitle={age} />
    </SafeAreaScrollView>
  )
}

export default CredentialDetails
