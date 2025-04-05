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
  options.credentials = 'include'
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

export const reqRegisterEmail = (email: string, captchaToken: string) =>
  request<void>('/registerEmail', {
    method: 'POST',
    body: {email, captcha_token: captchaToken},
  })

export const reqSendLoginCode = (email: string) =>
  request<void>('/sendLoginCode', {method: 'POST', body: {email}})

export const reqLoginCode = (email: string, code: string) =>
  request<void>('/loginCode', {
    method: 'POST',
    body: {email, login_code: code},
  })

export type EncPut =
  | {
      id: string
      type: 'note' | 'todo'
      created_at: number
      updated_at: number
      cipher_text: string
      iv: string
      version: number
      deleted_at: null
    }
  | {
      id: string
      type: 'note' | 'todo'
      created_at: number
      updated_at: number
      cipher_text: null
      iv: null
      version: number
      deleted_at: number
    }

export type EncSyncRes = {puts: EncPut[]; synced_to: number; conflicts: EncPut[]}

export const reqSyncNotes = (lastSyncedTo: number, puts: EncPut[], syncToken: string) =>
  request<EncSyncRes>('/syncNotes', {
    method: 'POST',
    body: {last_synced_to: lastSyncedTo, sync_token: syncToken, puts},
  })

export const reqDeleteNotes = (confirm: string) =>
  request<void>('/deleteNotes', {
    method: 'POST',
    body: {confirm},
  })

export const reqSendConfirmCode = () =>
  request<void>('/sendConfirmCode', {
    method: 'POST',
  })

export const reqLogout = () => request<void>('/logout', {method: 'POST'})

export const isUnauthorizedRes = (res: Res<unknown>) => !res.success && res.statusCode === 401
