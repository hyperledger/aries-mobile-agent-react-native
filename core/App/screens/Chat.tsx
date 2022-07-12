import { useAgent, useConnectionById, useBasicMessagesByConnectionId } from '@aries-framework/react-hooks'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { GiftedChat, IMessage } from 'react-native-gifted-chat'

import { uiConfig } from '../config/ui'
import HeaderLeftBack from '../components/buttons/HeaderLeftBack'
import { renderBubble, renderInputToolbar, renderComposer, renderSend } from '../components/chat'
import InfoIcon from '../components/misc/InfoIcon'
import { ContactStackParams, Screens, Stacks, TabStacks } from '../types/navigators'

type ChatProps = StackScreenProps<ContactStackParams, Screens.Chat>

const Chat: React.FC<ChatProps> = ({ navigation, route }) => {
  const { agent } = useAgent()
  const { t } = useTranslation()
  const connectionId = route?.params?.connectionId
  const connection = useConnectionById(route?.params?.connectionId)
  const basicMessages = useBasicMessagesByConnectionId(route?.params?.connectionId)

  const [messages, setMessages] = useState<any>([])

  useEffect(() => {
    navigation.setOptions({
      title: connection?.alias || connection?.invitation?.label,
      headerTitleAlign: 'center',
      headerRight: () => <InfoIcon connectionId={connection?.id} />,
      // Limit string to 30 chars
      headerLeft: () => (
        <HeaderLeftBack
          title={t('Global.Back')}
          accessibilityLabel={t('Global.Back')}
          onPress={() =>
            uiConfig.fiveTabDisplay
              ? navigation.getParent()?.navigate(TabStacks.ContactStack, { screen: Screens.Contacts })
              : navigation.getParent()?.navigate(Stacks.ContactStack, { screen: Screens.Contacts })
          }
        />
      ),
    })
  }, [connection])

  useEffect(() => {
    const transformedMessages = basicMessages.map((m: any) => {
      return {
        _id: m.id,
        text: m.content,
        record: m,
        createdAt: m.createdAt,
        type: m.type,
        user: { _id: m.role },
      }
    })
    setMessages(transformedMessages.sort((a: any, b: any) => b.createdAt - a.createdAt))
  }, [basicMessages])

  const onSend = async (messages: IMessage[]) => {
    await agent?.basicMessages.sendMessage(connectionId, messages[0].text)
  }

  return (
    <GiftedChat
      messages={messages}
      showAvatarForEveryMessage={true}
      renderAvatar={() => null}
      renderBubble={(props) => renderBubble(props)}
      renderInputToolbar={renderInputToolbar}
      renderSend={renderSend}
      renderComposer={(props) => renderComposer(props, 'Type Message Here')}
      onSend={onSend}
      user={{
        _id: 'sender',
      }}
    />
  )
}

export default Chat
