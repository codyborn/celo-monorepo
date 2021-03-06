import { trimLeading0x } from '@celo/utils/src/address'
import { sanitizeMessageBase64 } from '@celo/utils/src/attestations'
import URLSearchParamsReal from '@ungap/url-search-params'
import { Platform } from 'react-native'
import RNInstallReferrer from 'react-native-install-referrer'
import Logger from 'src/utils/Logger'

export const createInviteCode = (privateKey: string) => {
  // TODO(Rossy) we need some scheme to encrypt this PK
  // Buffer.from doesn't expect a 0x for hex input
  return Buffer.from(trimLeading0x(privateKey), 'hex').toString('base64')
}

// exported for testing
export const extractInviteCode = (inviteFieldInput: string) => {
  const sanitizedCode = sanitizeMessageBase64(inviteFieldInput)
  const regex = new RegExp('([0-9A-Za-z/\\+\\-\\_]*=)')
  const matches = sanitizedCode.match(regex)
  if (matches == null || matches.length === 0) {
    return null
  }
  return '0x' + Buffer.from(matches[0], 'base64').toString('hex')
}

// TODO(cmcewen): Consider web3 utils
export const isValidPrivateKey = (hexEncodedPrivateKey: string): boolean => {
  // First two chars are 0x
  if (hexEncodedPrivateKey.length !== 64 + 2) {
    return false
  }
  if (!hexEncodedPrivateKey.startsWith('0x')) {
    return false
  }
  return true
}

export function extractValidInviteCode(inviteFieldInput: string) {
  const inviteCode = extractInviteCode(inviteFieldInput)
  if (inviteCode == null || !isValidPrivateKey(inviteCode)) {
    return null
  } else {
    return inviteCode
  }
}

interface ReferrerData {
  clickTimestamp: string
  installReferrer: string
  installTimestamp: string
}

interface ReferrerDataError {
  message: string
}

export function decodeInvite(encodedInvite: string) {
  const params = new URLSearchParamsReal(decodeURIComponent(encodedInvite))
  const code: string = params.get('invite-code')
  return { code }
}

export const getValidInviteCodeFromReferrerData = async () => {
  if (Platform.OS === 'android') {
    const referrerData: ReferrerData | ReferrerDataError = await RNInstallReferrer.getReferrer()
    Logger.info(
      'invite/utils/getInviteCodeFromReferrerData',
      'Referrer Data: ' + JSON.stringify(referrerData)
    )
    if (referrerData && referrerData.hasOwnProperty('installReferrer')) {
      const { code } = decodeInvite((referrerData as ReferrerData).installReferrer)
      if (code) {
        const sanitizedCode = code.replace(' ', '+')
        // Accept invite codes which are either base64 encoded or direct hex keys
        if (isValidPrivateKey(sanitizedCode)) {
          return sanitizedCode
        }
        return extractValidInviteCode(sanitizedCode)
      }
    }
  }
  return null
}
