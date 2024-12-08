import {backendUrl, backendTimeout} from '../config'
import {fetchJson} from '../util/fetch'
import {Overwrite} from '../util/type'

export type ResPos<D> = {
  success: true
  data: D
}
export type ResNeg = {
  success: false
  error: string
  statusCode: number
}
export type Res<D> = ResPos<D> | ResNeg

export const request = async <D>(
  path: string,
  options: Overwrite<RequestInit, {body?: BodyInit | object}> = {},
  timeout: number = backendTimeout,
  abortController: AbortController = new AbortController()
): Promise<Res<D>> => {
  if (typeof options.body === 'object') {
    options.body = JSON.stringify(options.body)
    options.headers = {
      ...options.headers,
      'Content-Type': 'application/json',
    }
  }
  try {
    return await fetchJson<Res<D>>(
      backendUrl + path,
      options as RequestInit,
      timeout,
      abortController
    )
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      statusCode: -1,
    }
  }
}

export const reqRegisterEmail = (email: string) =>
  request<void>('/registerEmail', {
    method: 'POST',
    body: {email},
  })

export const reqLoginEmail = (email: string) =>
  request<void>('/loginEmail', {method: 'POST', body: {email}})

export const reqLoginCode = (email: string, code: string) =>
  request<{access_token: string}>('/loginCode', {method: 'POST', body: {email, login_code: code}})

export type EncCreate = {
  id: string
  created_at: number
  cipher_text: string
  iv: string
}
export type EncUpdate = {
  id: string
  cipher_text: string
  iv: string
  updated_at: number
}
export type Delete = {
  id: string
  deleted_at: number
}

export type EncSyncData = {
  creates: EncCreate[]
  updates: EncUpdate[]
  deletes: Delete[]
}

export const reqSyncNotes = (lastSyncedAt: number, data: EncSyncData, accessToken: string) =>
  request<EncSyncData>('/syncNotes', {
    method: 'POST',
    body: {access_token: accessToken, last_synced_at: lastSyncedAt, ...data},
  })
