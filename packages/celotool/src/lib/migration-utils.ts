import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'
import {
  AccountType,
  generatePrivateKey,
  getAddressesFor,
  getFaucetedAccounts,
  getPrivateKeysFor,
  privateKeyToAddress,
} from './generate_utils'
import { ensure0x } from './utils'

const DEFAULT_ELECTION_MIN_VALIDATORS = '1'
const DEFAULT_EPOCH_REWARDS_FROZEN = 'false'
const DEFAULT_EXCHANGE_FROZEN = 'false'
const DEFAULT_FAUCET_CUSD_WEI = '60000000000000000000000' /* 60k Celo Dollars */

export function minerForEnv() {
  return privateKeyToAddress(
    generatePrivateKey(fetchEnv(envVar.MNEMONIC), AccountType.VALIDATOR, 0)
  )
}

export function validatorKeys() {
  return getPrivateKeysFor(
    AccountType.VALIDATOR,
    fetchEnv(envVar.MNEMONIC),
    parseInt(fetchEnv(envVar.VALIDATORS), 10)
  ).map(ensure0x)
}

function getAttestationKeys() {
  return getPrivateKeysFor(
    AccountType.ATTESTATION,
    fetchEnv(envVar.MNEMONIC),
    parseInt(fetchEnv(envVar.VALIDATORS), 10)
  ).map(ensure0x)
}

export function migrationOverrides() {
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  const faucetedAccountAddresses = getFaucetedAccounts(mnemonic).map((account) => account.address)
  const attestationBotAddresses = getAddressesFor(AccountType.ATTESTATION_BOT, mnemonic, 10)
  const initialAddresses = [...faucetedAccountAddresses, ...attestationBotAddresses]

  const initialBalance = fetchEnvOrFallback(envVar.FAUCET_CUSD_WEI, DEFAULT_FAUCET_CUSD_WEI)

  return {
    election: {
      minElectableValidators: fetchEnvOrFallback(
        envVar.ELECTION_MIN_VALIDATORS,
        DEFAULT_ELECTION_MIN_VALIDATORS
      ),
    },
    epochRewards: {
      frozen:
        fetchEnvOrFallback(envVar.EPOCH_REWARDS_FROZEN, DEFAULT_EPOCH_REWARDS_FROZEN) === 'true',
    },
    exchange: {
      frozen: fetchEnvOrFallback(envVar.EXCHANGE_FROZEN, DEFAULT_EXCHANGE_FROZEN) === 'true',
    },
    stableToken: {
      initialBalances: {
        addresses: initialAddresses,
        values: initialAddresses.map(() => initialBalance),
      },
      oracles: getAddressesFor(AccountType.PRICE_ORACLE, mnemonic, 1),
    },
    validators: {
      validatorKeys: validatorKeys(),
      attestationKeys: getAttestationKeys(),
    },
  }
}

export function truffleOverrides() {
  return {
    from: minerForEnv(),
  }
}
