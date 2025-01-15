import { Agent } from '@credo-ts/core'
import { getProofRequestTemplates } from '@hyperledger/aries-bifold-verifier'
import { DefaultOCABundleResolver } from '@hyperledger/aries-oca/build/legacy'
import { StackNavigationProp } from '@react-navigation/stack'
import { createContext, useContext } from 'react'
import { DependencyContainer } from 'tsyringe'

import * as bundle from './assets/oca-bundles.json'
import Button from './components/buttons/Button'
import defaultIndyLedgers from './configs/ledgers/indy'
import { LocalStorageKeys, PINRules } from './constants'
import { TOKENS, Container, TokenMapping } from './container-api'
import { DispatchAction, ReducerAction } from './contexts/reducers/store'
import { defaultState } from './contexts/store'
import { useNotifications } from './hooks/notifications'
import { IHistoryManager } from './modules/history'
import HistoryManager from './modules/history/context/historyManager'
import OnboardingStack from './navigators/OnboardingStack'
import { DefaultScreenOptionsDictionary } from './navigators/defaultStackOptions'
import Developer from './screens/Developer'
import Onboarding from './screens/Onboarding'
import Preface from './screens/Preface'
import Splash from './screens/Splash'
import ScreenTerms, { TermsVersion } from './screens/Terms'
import { loadLoginAttempt } from './services/keychain'
import { BifoldLogger } from './services/logger'
import { AuthenticateStackParams, Screens } from './types/navigators'
import {
  Migration as MigrationState,
  Preferences as PreferencesState,
  State,
  Onboarding as StoreOnboardingState,
  Tours as ToursState,
  PersistentState,
} from './types/state'
import OnboardingPages from './screens/OnboardingPages'
import UseBiometry from './screens/UseBiometry'
import Scan from './screens/Scan'
import PINExplainer from './screens/PINExplainer'
import HomeHeaderView from './components/views/HomeHeaderView'
import HomeFooterView from './components/views/HomeFooterView'
import EmptyList from './components/misc/EmptyList'
import Record from './components/record/Record'
import NotificationListItem from './components/listItems/NotificationListItem'
import NoNewUpdates from './components/misc/NoNewUpdates'
import PINCreateHeader from './components/misc/PINCreateHeader'
import { PersistentStorage } from './services/storage'
import { Config, HistoryEventsLoggerConfig } from './types/config'
import { Locales } from './localization'
import ContactListItem from './components/listItems/ContactListItem'
import ContactCredentialListItem from './components/listItems/ContactCredentialListItem'
import { InlineErrorPosition } from './types/error'
import { DefaultScreenLayoutOptions } from './navigators/defaultLayoutOptions'

export const defaultConfig: Config = {
  PINSecurity: { rules: PINRules, displayHelper: false },
  settings: [],
  enableChat: true,
  enableTours: false,
  supportedLanguages: [Locales.en, Locales.fr, Locales.ptBr],
  showPreface: false,
  disableOnboardingSkip: false,
  disableContactsInSettings: false,
  disableMediatorCheck: false,
  internetReachabilityUrls: ['https://clients3.google.com/generate_204'],
  whereToUseWalletUrl: 'https://example.com',
  showScanHelp: true,
  showScanButton: true,
  showDetailsInfo: true,
  contactDetailsOptions: {
    showConnectedTime: true,
    enableEditContactName: true,
    enableCredentialList: false,
  },
}
export const defaultHistoryEventsLogger: HistoryEventsLoggerConfig = {
  logAttestationAccepted: true,
  logAttestationRefused: true,
  logAttestationRemoved: true,
  logInformationSent: true,
  logInformationNotSent: true,
  logConnection: true,
  logConnectionRemoved: true,
  logAttestationRevoked: true,
  logPinChanged: true,
  logToggleBiometry: true,
}

export class MainContainer implements Container {
  public static readonly TOKENS = TOKENS
  private _container: DependencyContainer
  private log?: BifoldLogger
  private storage: PersistentStorage<PersistentState>

  public constructor(container: DependencyContainer, log?: BifoldLogger) {
    this._container = container
    this.log = log
    this.storage = new PersistentStorage(log)
  }

  public get container(): DependencyContainer {
    return this._container
  }

  public init(): Container {
    this.log?.info(`Initializing Bifold container`)

    this._container.registerInstance(TOKENS.SCREEN_PREFACE, Preface)
    this._container.registerInstance(TOKENS.SCREEN_DEVELOPER, Developer)
    this._container.registerInstance(TOKENS.SCREEN_TERMS, { screen: ScreenTerms, version: TermsVersion })
    this._container.registerInstance(TOKENS.SCREEN_SPLASH, Splash)
    this._container.registerInstance(TOKENS.SCREEN_ONBOARDING_PAGES, OnboardingPages)
    this._container.registerInstance(TOKENS.COMPONENT_PIN_CREATE_HEADER, PINCreateHeader)
    this._container.registerInstance(TOKENS.SCREEN_USE_BIOMETRY, UseBiometry)
    this._container.registerInstance(TOKENS.SCREEN_SCAN, Scan)
    this._container.registerInstance(TOKENS.SCREEN_ONBOARDING_ITEM, Onboarding)
    this._container.registerInstance(TOKENS.SCREEN_ONBOARDING, Onboarding)
    this._container.registerInstance(TOKENS.SCREEN_PIN_EXPLAINER, PINExplainer)
    this._container.registerInstance(TOKENS.STACK_ONBOARDING, OnboardingStack)
    this._container.registerInstance(TOKENS.COMP_BUTTON, Button)
    this._container.registerInstance(TOKENS.GROUP_BY_REFERENT, false)
    this._container.registerInstance(TOKENS.HISTORY_ENABLED, false)
    this._container.registerInstance(TOKENS.HISTORY_EVENTS_LOGGER, defaultHistoryEventsLogger)
    this._container.registerInstance(TOKENS.CRED_HELP_ACTION_OVERRIDES, [])
    this._container.registerInstance(TOKENS.OBJECT_SCREEN_CONFIG, DefaultScreenOptionsDictionary)
    this._container.registerInstance(TOKENS.OBJECT_LAYOUT_CONFIG, DefaultScreenLayoutOptions)
    this._container.registerInstance(TOKENS.UTIL_LOGGER, new BifoldLogger())
    this._container.registerInstance(TOKENS.UTIL_OCA_RESOLVER, new DefaultOCABundleResolver(bundle))
    this._container.registerInstance(TOKENS.UTIL_LEDGERS, defaultIndyLedgers)
    this._container.registerInstance(TOKENS.UTIL_PROOF_TEMPLATE, getProofRequestTemplates)
    this._container.registerInstance(TOKENS.UTIL_ATTESTATION_MONITOR, { useValue: undefined })
    this._container.registerInstance(TOKENS.NOTIFICATIONS, {
      useNotifications,
    })
    this._container.registerInstance(TOKENS.NOTIFICATIONS_LIST_ITEM, NotificationListItem)
    this._container.registerInstance(TOKENS.CONFIG, defaultConfig)
    this._container.registerInstance(TOKENS.COMPONENT_CRED_LIST_HEADER_RIGHT, () => null)
    this._container.registerInstance(TOKENS.COMPONENT_CRED_LIST_OPTIONS, () => null)
    this._container.registerInstance(TOKENS.COMPONENT_CRED_LIST_FOOTER, () => null)
    this._container.registerInstance(TOKENS.COMPONENT_HOME_HEADER, HomeHeaderView)
    this._container.registerInstance(TOKENS.COMPONENT_HOME_NOTIFICATIONS_EMPTY_LIST, NoNewUpdates)
    this._container.registerInstance(TOKENS.COMPONENT_HOME_FOOTER, HomeFooterView)
    this._container.registerInstance(TOKENS.COMPONENT_CRED_EMPTY_LIST, EmptyList)
    this._container.registerInstance(TOKENS.COMPONENT_RECORD, Record)
    this._container.registerInstance(TOKENS.COMPONENT_CONTACT_LIST_ITEM, ContactListItem)
    this._container.registerInstance(TOKENS.COMPONENT_CONTACT_DETAILS_CRED_LIST_ITEM, ContactCredentialListItem)
    this._container.registerInstance(TOKENS.CACHE_CRED_DEFS, [])
    this._container.registerInstance(TOKENS.CACHE_SCHEMAS, [])
    this._container.registerInstance(TOKENS.INLINE_ERRORS, {
      enabled: true,
      hasErrorIcon: true,
      position: InlineErrorPosition.Above,
    })
    this._container.registerInstance(
      TOKENS.FN_ONBOARDING_DONE,
      (dispatch: React.Dispatch<ReducerAction<unknown>>, navigation: StackNavigationProp<AuthenticateStackParams>) => {
        return () => {
          dispatch({
            type: DispatchAction.DID_COMPLETE_TUTORIAL,
          })

          navigation.navigate(Screens.Terms)
        }
      }
    )
    this._container.registerInstance(TOKENS.FN_LOAD_HISTORY, (agent: Agent<any>): IHistoryManager => {
      return new HistoryManager(agent)
    })
    this._container.registerInstance(TOKENS.CUSTOM_NAV_STACK_1, false)
    this._container.registerInstance(TOKENS.LOAD_STATE, async (dispatch: React.Dispatch<ReducerAction<unknown>>) => {
      const loadState = async <Type>(key: LocalStorageKeys, updateVal: (newVal: Type) => void) => {
        const data = await this.storage.getValueForKey(key)
        if (data) {
          // @ts-expect-error Fix complicated type error
          updateVal(data)
        }
      }

      let loginAttempt = defaultState.loginAttempt
      let preferences = defaultState.preferences
      let migration = defaultState.migration
      let tours = defaultState.tours
      let onboarding = defaultState.onboarding

      await Promise.all([
        loadLoginAttempt().then((data) => {
          if (data) {
            loginAttempt = data
          }
        }),
        loadState<PreferencesState>(LocalStorageKeys.Preferences, (val) => (preferences = val)),
        loadState<MigrationState>(LocalStorageKeys.Migration, (val) => (migration = val)),
        loadState<ToursState>(LocalStorageKeys.Tours, (val) => (tours = val)),
        loadState<StoreOnboardingState>(LocalStorageKeys.Onboarding, (val) => (onboarding = val)),
      ])

      const state = {
        loginAttempt: { ...defaultState.loginAttempt, ...loginAttempt },
        preferences: { ...defaultState.preferences, ...preferences },
        migration: { ...defaultState.migration, ...migration },
        tours: { ...defaultState.tours, ...tours },
        onboarding: { ...defaultState.onboarding, ...onboarding },
      } as State

      dispatch({ type: DispatchAction.STATE_DISPATCH, payload: [state] })
    })

    return this
  }

  public resolve<K extends keyof TokenMapping>(token: K): TokenMapping[K] {
    return this._container.resolve(token)
  }
  public resolveAll<K extends keyof TokenMapping, T extends K[]>(
    tokens: [...T]
  ): { [I in keyof T]: TokenMapping[T[I]] } {
    return tokens.map((key) => this.resolve(key)!) as { [I in keyof T]: TokenMapping[T[I]] }
  }
}

export const SystemContext = createContext<Container | undefined>(undefined)

export const SystemProvider = SystemContext.Provider

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const useSystem = () => useContext(SystemContext)!
