import { NetInfoStateType, useNetInfo } from '@react-native-community/netinfo'
import * as React from 'react'
import { createContext, useContext, useState } from 'react'

import NetInfoModal from '../components/modals/NetInfoModal'
import { hostnameFromURL, canConnectToHost } from '../utils/network'
import { Config } from 'react-native-config'

export interface NetworkContext {
  silentAssertConnectedNetwork: () => boolean
  assertNetworkConnected: () => boolean
  displayNetInfoModal: () => void
  hideNetInfoModal: () => void
  assertInternetReachable: (_urls?: string[]) => Promise<boolean>
  assertMediatorReachable: () => Promise<boolean>
}

export const NetworkContext = createContext<NetworkContext>(null as unknown as NetworkContext)

export const NetworkProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const netInfo = useNetInfo()
  const [isNetInfoModalDisplayed, setIsNetInfoModalDisplayed] = useState<boolean>(false)

  const displayNetInfoModal = () => {
    setIsNetInfoModalDisplayed(true)
  }

  const hideNetInfoModal = () => {
    setIsNetInfoModalDisplayed(false)
  }

  const silentAssertConnectedNetwork = () => {
    return netInfo.isConnected || [NetInfoStateType.wifi, NetInfoStateType.cellular].includes(netInfo.type)
  }

  const assertNetworkConnected = () => {
    const isConnected = silentAssertConnectedNetwork()
    if (!isConnected) {
      displayNetInfoModal()
    }
    return isConnected
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const assertInternetReachable = async (_urls?: string[]): Promise<boolean> => {

     return netInfo.isInternetReachable as boolean
    /*
    // Ping internet check beacon endponits, set internetReachable to be true positive response from anyone
    try {
      let isReached = false;
      await Promise.all(urls.map(async (url) => {
        const response = await fetch(url)
        if ("204" === `${response.status}` || "200" === `${response.status}`) {
          isReached = true
        }
      }));
      return isReached
    } catch (error) {
      return false
    }
    */
  }

  const assertMediatorReachable = async (): Promise<boolean> => {
    const hostname = hostnameFromURL(Config.MEDIATOR_URL!)

    if (hostname === null || hostname.length === 0) {
      return false
    }

    const nodes = [{ host: hostname, port: 443 }]
    const connections = await Promise.all(nodes.map((n: { host: string; port: number }) => canConnectToHost(n)))

    return connections.includes(true)
  }

  return (
    <NetworkContext.Provider
      value={{
        silentAssertConnectedNetwork,
        assertNetworkConnected,
        displayNetInfoModal,
        hideNetInfoModal,
        assertInternetReachable,
        assertMediatorReachable
      }}
    >
      {children}
      <NetInfoModal visible={isNetInfoModalDisplayed} onSubmit={() => hideNetInfoModal()} />
    </NetworkContext.Provider>
  )
}

export const useNetwork = () => useContext(NetworkContext)
