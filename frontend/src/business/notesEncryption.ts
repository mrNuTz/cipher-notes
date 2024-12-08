import {z} from 'zod'
import {EncSyncData} from '../services/backend'
import {Delete} from '../services/backend'
import {decryptData, encryptData, importKey} from '../util/encryption'

export type Create = {
  id: string
  created_at: number
  txt: string
}
export type Update = {
  id: string
  txt: string
  updated_at: number
}
export type SyncData = {
  creates: Create[]
  updates: Update[]
  deletes: Delete[]
}

export const decryptSyncData = async (
  cryptoKey: string,
  syncData: EncSyncData
): Promise<SyncData> => {
  const key = await importKey(cryptoKey)

  const creates = await Promise.all(
    syncData.creates.map(({id, created_at, cipher_text, iv}) =>
      decryptData(key, cipher_text, iv).then((txt) => ({id, created_at, txt}))
    )
  )
  const updates = await Promise.all(
    syncData.updates.map(({id, updated_at, cipher_text, iv}) =>
      decryptData(key, cipher_text, iv).then((txt) => ({id, txt, updated_at}))
    )
  )

  return {creates, updates, deletes: syncData.deletes}
}

export const encryptSyncData = async (
  cryptoKey: string,
  syncData: SyncData
): Promise<EncSyncData> => {
  const key = await importKey(cryptoKey)
  const creates = await Promise.all(
    syncData.creates.map(({id, created_at, txt}) =>
      encryptData(key, txt).then(({cipher_text, iv}) => ({id, created_at, cipher_text, iv}))
    )
  )
  const updates = await Promise.all(
    syncData.updates.map(({id, updated_at, txt}) =>
      encryptData(key, txt).then(({cipher_text, iv}) => ({id, updated_at, cipher_text, iv}))
    )
  )
  return {creates, updates, deletes: syncData.deletes}
}

export const isValidKeyTokenPair = (keyTokenPair: string) => {
  const [cryptoKey, syncToken] = keyTokenPair.split(':')
  return (
    z.string().base64().length(44).safeParse(cryptoKey).success &&
    z.string().base64().length(24).safeParse(syncToken).success
  )
}
