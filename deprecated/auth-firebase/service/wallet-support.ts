/**
 * Wallet Support - Firebase Firestore integration for wallet addresses
 */

import { collection, doc, getDoc, setDoc } from 'firebase/firestore'

import { auth, db } from './firebase-support'

const isObject = (obj: any): obj is Record<any, any> => typeof obj === 'object' && obj !== null
const isGlobalThisEthereum = (obj: any): obj is { ethereum: { request: <R = any>(payload: Record<any, any>) => Promise<R> } } => isObject(obj) && isObject(obj.ethereum) && typeof obj.ethereum.request === 'function'
const getEthereum = (obj: any) => isGlobalThisEthereum(obj) ? obj.ethereum : null

const ethereum = getEthereum(globalThis)

let signMessage = (opts: { siteName: string, address: string }) => `${opts.siteName} wants you to sign in with your Ethereum account:\n${opts.address}`

const USER_INFO_COLLECTION = 'HZ_USER_INFO'

async function connectWalletAddress(siteName?: string) {
  if (!ethereum) {
    throw new Error('No ethereum provider found')
  }

  if (!auth) {
    throw new Error('Firebase auth not configured')
  }

  const [account] = await ethereum.request<string[]>({ method: 'eth_requestAccounts' })

  if (!account) {
    throw new Error('No account found')
  }

  const signed = await ethereum.request<string>({
    method: 'personal_sign',
    params: [
      signMessage({
        siteName: siteName ?? auth.app.options.projectId ?? globalThis.location.hostname,
        address: account,
      }),
      account,
      auth.app.options.appId,
    ],
  })

  if (!signed) {
    throw new Error('Not signed')
  }

  return {account, signed}
}

export async function associateWalletAddressWithAccount(userEmail: string, siteName?: string) {
  const {account} = await connectWalletAddress(siteName)

  if (!db) {
    return { result: null, error: new Error('Firebase Firestore not configured') }
  }

  let result = null
  let error = null
  const accountsRef = collection(db, USER_INFO_COLLECTION)

  try {
    try {
      await setDoc(doc(accountsRef, userEmail), { walletAddress: account })
      result = account
    } catch (e) {
      console.error(e)
      error = e
    }
  } catch (e) {
    console.error(e)
    error = e
  }

  return { result, error }
}

export async function getAssociatedWalletAddress(userEmail: string) : Promise<{error: any, result?: string}> {
  if (!db) {
    return { error: new Error('Firebase Firestore not configured'), result: undefined }
  }

  let result = undefined
  let error = null
  try {
    try {
      const docRef = await getDoc(doc(db, USER_INFO_COLLECTION, userEmail))
      result = docRef.data() ? docRef.data()!.walletAddress as string : undefined
    }
    catch (e) {
      console.error(e)
      error = e
    }
  }
  catch (e) {
    console.error(e)
    error = e
  }

  return { result, error }
}
