import React, { useState } from 'react'

import { SafeAreaScrollView, Button, AppHeaderLarge, ModularView, CheckBoxRow } from 'components'

interface Props {
  navigation: any
}

const mockTitle = 'Terms of Service'
const mockMessage =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vel consectetur diam. Nunc sit amet elit est. Praesent libero elit, consectetur dapibus diam non, facilisis euismod velit. Etiam a ligula eget leo elementum tincidunt. Fusce et lorem turpis. Nunc tempus nisl consectetur eros vehicula venenatis. Suspendisse potenti. Aenean vitae aliquet augue. Maecenas lacinia nunc vitae blandit hendrerit. Sed congue risus quis magna convallis sollicitudin. Integer in ante vel orci ornare porta quis id libero. Proin mollis urna nec lectus fringilla, sit amet aliquam urna fringilla. Praesent pellentesque non augue et gravida. Donec congue urna ac massa consequat, lacinia condimentum dolor blandit. Nam ultrices tellus at risus dignissim, quis cursus mauris pellentesque. Donec at scelerisque ipsum. Praesent eu massa at tellus cursus ornare. Fusce vel faucibus dolor. Etiam blandit velit sed velit tempus feugiat. Donec condimentum pretium suscipit. Sed suscipit, leo molestie tempus maximus, turpis enim hendrerit nibh, semper sagittis turpis velit sed nisl. Aliquam eu ultrices velit. Aenean tristique mauris justo, eu commodo quam semper non. Curabitur ultricies auctor mi eu tempus. Sed bibendum eros sed neque semper fermentum. Nullam porta tortor ut ante congue molestie. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Curabitur sit amet aliquam nunc, malesuada auctor quam. Pellentesque vel lobortis risus, volutpat suscipit velit. Aenean ut erat sed metus interdum mattis. Nam consectetur ante eu felis rhoncus, et volutpat dolor tincidunt. Vivamus sit amet feugiat mi. Proin in dui ac metus vehicula fringilla eget id mauris. Maecenas et elit venenatis dolor pulvinar pulvinar in et leo. Aliquam scelerisque viverra sapien at bibendum. Curabitur et libero nec enim convallis porttitor sed a libero. In hac habitasse platea dictumst. Integer dignissim velit eu pharetra ultricies. Vestibulum at velit hendrerit, pretium purus eget, lobortis tellus. Maecenas non erat ut lacus scelerisque luctus et et tellus.'

const Terms: React.FC<Props> = ({ navigation }) => {
  const [checked, setChecked] = useState(false)

  return (
    <SafeAreaScrollView>
      <AppHeaderLarge />
      <ModularView title={mockTitle} content={mockMessage} />
      <CheckBoxRow title="I Agree to the Terms of Service" checked={checked} onPress={() => setChecked(!checked)} />
      <Button title="Submit" disabled={!checked} onPress={() => navigation.navigate('Create 6-Digit Pin')} />
    </SafeAreaScrollView>
  )
}

export default Terms
