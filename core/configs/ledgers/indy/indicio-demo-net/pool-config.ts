import { IndyPoolConfig } from '@aries-framework/core/build/modules/ledger/IndyPool'
import genesisFile from './genesis-file'

const config: IndyPoolConfig = {
  id: 'IndicioDemoNet',
  genesisTransactions: genesisFile,
  isProduction: false,
}

export default config
