import { useIsFocused } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, View, Dimensions } from 'react-native'

import NotificationListItem, { NotificationType } from '../components/listItems/NotificationListItem'
import InfoBox, { InfoBoxType } from '../components/misc/InfoBox'
import NoNewUpdates from '../components/misc/NoNewUpdates'
import AppGuideModal from '../components/modals/AppGuideModal'
import { AttachTourStep } from '../components/tour/AttachTourStep'
import { useConfiguration } from '../contexts/configuration'
import { DispatchAction } from '../contexts/reducers/store'
import { useStore } from '../contexts/store'
// import { useTheme } from '../contexts/theme'
import { useTour } from '../contexts/tour/tour-context'
import { HomeStackParams, Screens } from '../types/navigators'

const { width } = Dimensions.get('window')
const offset = 25

type HomeProps = StackScreenProps<HomeStackParams, Screens.Home>

const Home: React.FC<HomeProps> = () => {
  const { useCustomNotifications, enableTours: enableToursConfig } = useConfiguration()
  const { notifications } = useCustomNotifications()
  const { t } = useTranslation()
  const { homeFooterView: HomeFooterView, homeHeaderView: HomeHeaderView } = useConfiguration()

  // This syntax is required for the jest mocks to work
  // eslint-disable-next-line import/no-named-as-default-member
  // const { HomeTheme } = useTheme()
  const [store, dispatch] = useStore()
  const { start, stop } = useTour()
  const [showTourPopup, setShowTourPopup] = useState(false)
  const screenIsFocused = useIsFocused()

  // const styles = StyleSheet.create({
  //   container: {
  //     paddingHorizontal: offset,
  //   },
  //   rowContainer: {
  //     flexDirection: 'row',
  //     justifyContent: 'space-between',
  //     alignItems: 'center',
  //     flexWrap: 'wrap',
  //     paddingHorizontal: offset,
  //   },
  //   messageContainer: {
  //     alignItems: 'center',
  //     justifyContent: 'center',
  //     marginTop: 35,
  //     marginHorizontal: offset,
  //   },
  //   header: {
  //     marginTop: offset,
  //     marginBottom: 20,
  //   },
  //   linkContainer: {
  //     minHeight: HomeTheme.link.fontSize,
  //     marginTop: 10,
  //   },
  //   link: {
  //     ...HomeTheme.link,
  //   },
  // })

  const DisplayListItemType = (item: any): Element => {
    let component: Element
    if (item.type === 'CredentialRecord') {
      let notificationType = NotificationType.CredentialOffer
      if (item.revocationNotification) {
        notificationType = NotificationType.Revocation
      }
      component = <NotificationListItem notificationType={notificationType} notification={item} />
    } else if (item.type === 'CustomNotification') {
      component = <NotificationListItem notificationType={NotificationType.Custom} notification={item} />
    } else {
      component = <NotificationListItem notificationType={NotificationType.ProofRequest} notification={item} />
    }
    return component
  }

  useEffect(() => {
    const shouldShowTour =
      store.preferences.developerModeEnabled &&
      enableToursConfig &&
      store.tours.enableTours &&
      !store.tours.seenHomeTour

    if (shouldShowTour && screenIsFocused) {
      if (store.tours.seenToursPrompt) {
        dispatch({
          type: DispatchAction.UPDATE_SEEN_HOME_TOUR,
          payload: [true],
        })
        start()
      } else {
        dispatch({
          type: DispatchAction.UPDATE_SEEN_TOUR_PROMPT,
          payload: [true],
        })
        setShowTourPopup(true)
      }
    }

    return stop
  }, [screenIsFocused])

  const onCTAPressed = () => {
    setShowTourPopup(false)
    dispatch({
      type: DispatchAction.ENABLE_TOURS,
      payload: [true],
    })
    dispatch({
      type: DispatchAction.UPDATE_SEEN_HOME_TOUR,
      payload: [true],
    })
    start()
  }

  const onDismissPressed = () => {
    setShowTourPopup(false)
    dispatch({
      type: DispatchAction.ENABLE_TOURS,
      payload: [false],
    })
  }

  return (
    <>
      <FlatList
        style={{ marginBottom: 35 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={notifications?.length > 0 ? true : false}
        decelerationRate="fast"
        ListEmptyComponent={() => (
          <View style={{ marginHorizontal: offset, width: width - 2 * offset }}>
            <AttachTourStep index={1} fill>
              <View>
                <NoNewUpdates />
              </View>
            </AttachTourStep>
          </View>
        )}
        ListHeaderComponent={() => <HomeHeaderView />}
        ListFooterComponent={() => <HomeFooterView />}
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              marginHorizontal: 20,
              marginVertical: 10,
            }}
          >
            {DisplayListItemType(item)}
          </View>
        )}
      />
      {showTourPopup && (
        <AppGuideModal
          title={t('Tour.GuideTitle')}
          description={t('Tour.WouldYouLike')}
          onCallToActionPressed={onCTAPressed}
          onCallToActionLabel={t('Tour.UseAppGuides')}
          onSecondCallToActionPressed={onDismissPressed}
          onSecondCallToActionLabel={t('Tour.DoNotUseAppGuides')}
          onDismissPressed={onDismissPressed}
        />
      )}
    </>
  )
}

export default Home
