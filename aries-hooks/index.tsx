import React, { createContext, useState, useEffect, useContext } from 'react'

import { downloadGenesis, storeGenesis } from './genesis-utils'

import {
  Agent,
  InitConfig,
  HttpOutboundTransporter,
  ConnectionState,
  CredentialState,
  ProofState,
  ConnectionEventTypes,
  CredentialEventTypes,
  ProofEventTypes,
  ConnectionStateChangedEvent,
  CredentialStateChangedEvent,
  ProofStateChangedEvent,
  ConnectionRecord,
  ProofRecord,
  CredentialRecord,
  WsOutboundTransporter,
} from '@aries-framework/core'

import { agentDependencies } from '@aries-framework/react-native'

const AgentContext = createContext<any>({})
const ConnectionContext = createContext<any>({})
const CredentialContext = createContext<any>({})
const ProofContext = createContext<any>({})

// Agent
export const useAgent = (): { agent: Agent; loading: boolean } => {
  return useContext(AgentContext)
}

// Connection
export const useConnections = (): { connections: ConnectionRecord[]; loading: boolean } => {
  return useContext(ConnectionContext)
}

export const useConnectionById = (id: string): ConnectionRecord => {
  const { connections } = useContext(ConnectionContext)
  const connection = connections.find((c: ConnectionRecord) => c.id === id)
  return connection
}

export const useConnectionByState = (state: ConnectionState): ConnectionRecord[] => {
  const connectionState = useContext(ConnectionContext)
  const connections = connectionState.connections.filter((c: ConnectionRecord) => c.state === state)
  return connections
}

// Credential
export const useCredentials = (): { credentials: CredentialRecord[]; loading: boolean } => {
  return useContext(CredentialContext)
}

export const useCredentialById = (id: string): CredentialRecord => {
  const { credentials } = useContext(CredentialContext)
  const credential = credentials.find((c: CredentialRecord) => c.id === id)
  return credential
}

export const useCredentialByState = (state: CredentialState): CredentialRecord[] => {
  const credentialState = useContext(CredentialContext)
  const credentials = credentialState.credentials.filter((c: CredentialRecord) => c.state === state)
  return credentials
}

// Proofs
export const useProofs = (): { proofs: ProofRecord[]; loading: boolean } => {
  return useContext(ProofContext)
}

export const useProofById = (id: string): ProofRecord => {
  const { proofs } = useContext(ProofContext)
  const proof = proofs.find((p: ProofRecord) => p.id === id)
  return proof
}

export const useProofByState = (state: ProofState): ProofRecord[] => {
  const proofState = useContext(ProofContext)
  const proofs = proofState.proofs.filter((p: ProofRecord) => p.state === state)
  return proofs
}

interface Props {
  agentConfig: InitConfig
  genesisUrl: string
  children: any
}

const AgentProvider: React.FC<Props> = ({ agentConfig, genesisUrl, children }) => {
  const [agentState, setAgentState] = useState<{
    agent: Agent | null
    loading: boolean
  }>({
    agent: null,
    loading: true,
  })
  const [connectionState, setConnectionState] = useState<{ connections: ConnectionRecord[] | []; loading: boolean }>({
    connections: [],
    loading: true,
  })
  const [credentialState, setCredentialState] = useState<{ credentials: CredentialRecord[] | []; loading: boolean }>({
    credentials: [],
    loading: true,
  })
  const [proofState, setProofState] = useState<{ proofs: ProofRecord[] | []; loading: boolean }>({
    proofs: [],
    loading: true,
  })

  useEffect(() => {
    setInitialState()
  }, [])

  const setInitialState = async () => {
    const genesis = await downloadGenesis(genesisUrl)
    const genesisPath = await storeGenesis(genesis, 'genesis.txn')

    const agent = new Agent({ ...agentConfig, genesisPath }, agentDependencies)

    const wsTransport = new WsOutboundTransporter()
    const httpTransport = new HttpOutboundTransporter()

    agent.registerOutboundTransporter(wsTransport)
    agent.registerOutboundTransporter(httpTransport)

    await agent.initialize()
    const connections = await agent.connections.getAll()
    const credentials = await agent.credentials.getAll()
    const proofs = await agent.proofs.getAll()

    startConnectionsListener(agent)
    startCredentialsListener(agent)
    startProofsListener(agent)

    setAgentState({ agent, loading: false })
    setConnectionState({ connections, loading: false })
    setCredentialState({ credentials, loading: false })
    setProofState({ proofs, loading: false })
  }

  const startConnectionsListener = (agent: Agent) => {
    const listener = (event: ConnectionStateChangedEvent) => {
      setConnectionState({
        ...connectionState,
        connections: [...connectionState.connections, event.payload.connectionRecord],
      })
    }

    agent.events.on(ConnectionEventTypes.ConnectionStateChanged, listener)
  }

  const startCredentialsListener = (agent: Agent) => {
    const listener = async (event: CredentialStateChangedEvent) => {
      setCredentialState({
        ...credentialState,
        credentials: [...credentialState.credentials, event.payload.credentialRecord],
      })
    }

    agent.events.on(CredentialEventTypes.CredentialStateChanged, listener)
  }

  const startProofsListener = (agent: Agent) => {
    const listener = (event: ProofStateChangedEvent) => {
      setProofState({ ...proofState, proofs: [...proofState.proofs, event.payload.proofRecord] })
    }

    agent.events.on(ProofEventTypes.ProofStateChanged, listener)
  }

  return (
    <AgentContext.Provider value={agentState}>
      <ConnectionContext.Provider value={connectionState}>
        <CredentialContext.Provider value={credentialState}>
          <ProofContext.Provider value={proofState}>{children}</ProofContext.Provider>
        </CredentialContext.Provider>
      </ConnectionContext.Provider>
    </AgentContext.Provider>
  )
}

export default AgentProvider
