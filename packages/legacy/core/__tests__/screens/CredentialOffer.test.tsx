import { CredentialExchangeRecord } from '@credo-ts/core'
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock'
import { useNavigation } from '@react-navigation/native'
import { act, fireEvent, render } from '@testing-library/react-native'
import fs from 'fs'
import path from 'path'
import React from 'react'

import { NetworkProvider } from '../../App/contexts/network'
import CredentialOffer from '../../App/screens/CredentialOffer'
import { testIdWithKey } from '../../App/utils/testable'
import { BasicAppContext } from '../helpers/app'

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo)
jest.mock('@hyperledger/anoncreds-react-native', () => ({}))
jest.mock('@hyperledger/aries-askar-react-native', () => ({}))
jest.mock('@hyperledger/indy-vdr-react-native', () => ({}))
// eslint-disable-next-line @typescript-eslint/no-empty-function
jest.mock('react-native-localize', () => {})
jest.useFakeTimers({ legacyFakeTimers: true })
jest.spyOn(global, 'setTimeout')

const props = { params: { visible: true, credentialId: '123' } }

const credentialPath = path.join(__dirname, '../fixtures/degree-credential.json')
const credential = JSON.parse(fs.readFileSync(credentialPath, 'utf8'))

const credentialRecord = new CredentialExchangeRecord(credential)
credentialRecord.credentials.push({
  credentialRecordType: 'anoncreds',
  credentialRecordId: '',
})
// TODO:(jl) Make a fn to revive JSON dates properly and pass to `parse`
credentialRecord.createdAt = new Date(credentialRecord.createdAt)


describe('CredentialOffer Screen', () => {
  test('renders correctly', async () => {
    const tree = render(
      <BasicAppContext>
        <NetworkProvider>
          <CredentialOffer route={props as any} navigation={useNavigation()} />
        </NetworkProvider>
      </BasicAppContext>
    )

    await act(async () => {})

    expect(tree).toMatchSnapshot()
  })

  test('shows offer controls', async () => {
    const { getByTestId } = render(
      <BasicAppContext>
        <NetworkProvider>
          <CredentialOffer route={props as any} navigation={useNavigation()} />
        </NetworkProvider>
      </BasicAppContext>
    )

    await act(async () => {})

    const acceptButton = getByTestId(testIdWithKey('AcceptCredentialOffer'))
    const declineButton = getByTestId(testIdWithKey('DeclineCredentialOffer'))

    expect(acceptButton).not.toBeNull()
    expect(declineButton).not.toBeNull()
  })

  test('accepting a credential', async () => {
    const tree = render(
      <BasicAppContext>
        <NetworkProvider>
          <CredentialOffer route={props as any} navigation={useNavigation()} />
        </NetworkProvider>
      </BasicAppContext>
    )

    await act(async () => {})

    const acceptButton = tree.getByTestId(testIdWithKey('AcceptCredentialOffer'))

    fireEvent(acceptButton, 'press')

    expect(tree).toMatchSnapshot()
  })

  test('declining a credential', async () => {
    const tree = render(
      <BasicAppContext>
        <NetworkProvider>
          <CredentialOffer route={props as any} navigation={useNavigation()} />
        </NetworkProvider>
      </BasicAppContext>
    )

    await act(async () => {})

    const declineButton = tree.getByTestId(testIdWithKey('DeclineCredentialOffer'))

    fireEvent(declineButton, 'press')

    expect(tree).toMatchSnapshot()
  })
})
