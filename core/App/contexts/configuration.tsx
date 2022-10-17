import { CredentialExchangeRecord, CredentialMetadataKeys } from '@aries-framework/core'
import { createContext, useContext } from 'react'

import { RecordProps } from '../components/record/Record'
import OnboardingPages from '../screens/OnboardingPages'
import { OCABundleResolver } from '../types/oca'

export interface ConfigurationContext {
  pages: typeof OnboardingPages
  splash: React.FC
  terms: React.FC
  homeContentView: React.FC
  OCABundle: OCABundleResolver
  useBiometry: React.FC
  record: React.FC<RecordProps>
}

export const ConfigurationContext = createContext<ConfigurationContext>(null as unknown as ConfigurationContext)

export const ConfigurationProvider = ConfigurationContext.Provider

export const useConfiguration = () => useContext(ConfigurationContext)
