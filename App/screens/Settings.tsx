import React from 'react'

import { SafeAreaScrollView, Label } from 'components'

function Settings() {
  return (
    <SafeAreaScrollView>
      <Label title="Version" subtitle="0.0.1" />
      <Label title="AMA-RN Version" subtitle="0.1.0" />
    </SafeAreaScrollView>
  )
}

export default Settings
