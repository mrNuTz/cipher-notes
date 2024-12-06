import {reqRegisterEmail} from '../services/backend'
import {showMessage} from './messages'
import {getState, setState} from './store'

export type UserState = {
  email: string | null
  registerDialog: {open: boolean; email: string; loading: boolean}
}

export const userInit: UserState = {
  email: null,
  registerDialog: {open: false, email: '', loading: false},
}

export const registerEmailChanged = (email: string) => {
  setState((state) => {
    state.user.registerDialog.email = email
  })
}

export const registerEmail = async () => {
  const state = getState()
  const {email, loading} = state.user.registerDialog
  if (!email || loading) return
  setState((state) => {
    state.user.registerDialog.loading = true
  })
  const res = await reqRegisterEmail(email)
  setState((state) => {
    state.user.registerDialog.loading = false
  })
  if (!res.success) {
    showMessage({
      title: 'Register Email Failed',
      text: res.error,
    })
    return
  }
  showMessage({
    title: 'Register Email',
    text: 'Email registered, proceed to login',
  })
  closeRegisterDialog()
}

export const openRegisterDialog = () => {
  setState((state) => {
    state.user.registerDialog = {open: true, email: '', loading: false}
  })
}

export const closeRegisterDialog = () => {
  setState((state) => {
    state.user.registerDialog.open = false
  })
}
