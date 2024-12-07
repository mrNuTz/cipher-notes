import {reqLoginCode, reqLoginEmail, reqRegisterEmail} from '../services/backend'
import {showMessage} from './messages'
import {getState, setState} from './store'

export type UserState = {
  email: string
  accessToken: string
  registerDialog: {open: boolean; email: string; loading: boolean}
  loginDialog: {
    open: boolean
    email: string
    code: string
    loading: boolean
    status: 'email' | 'code'
  }
}

export const userInit: UserState = {
  email: '',
  accessToken: '',
  registerDialog: {open: false, email: '', loading: false},
  loginDialog: {open: false, email: '', code: '', loading: false, status: 'email'},
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
  setState((state) => {
    state.user.email = email
    state.user.registerDialog.open = false
  })
  openLoginDialog()
}
export const openRegisterDialog = () => {
  setState((state) => {
    state.user.registerDialog = {open: true, email: state.user.email, loading: false}
  })
}
export const closeRegisterDialog = () => {
  setState((state) => {
    state.user.registerDialog.open = false
  })
}
export const openLoginDialog = () => {
  setState((state) => {
    state.user.loginDialog = {
      open: true,
      email: state.user.email,
      code: '',
      loading: false,
      status: 'email',
    }
  })
}
export const closeLoginDialog = () => {
  setState((state) => {
    state.user.loginDialog.open = false
  })
}
export const loginEmailChanged = (email: string) => {
  setState((state) => {
    state.user.loginDialog.email = email
  })
}
export const loginCodeChanged = (code: string) => {
  setState((state) => {
    state.user.loginDialog.code = code
  })
}
export const switchLoginStatus = () => {
  setState((state) => {
    state.user.loginDialog.status = state.user.loginDialog.status === 'email' ? 'code' : 'email'
  })
}
export const loginEmail = async () => {
  const state = getState()
  const {email, loading} = state.user.loginDialog
  if (!email || loading) return
  setState((state) => {
    state.user.loginDialog.loading = true
  })
  const res = await reqLoginEmail(email)
  setState((state) => {
    state.user.loginDialog.loading = false
  })
  if (!res.success) {
    showMessage({
      title: 'Login Email Failed',
      text: res.error,
    })
    return
  }
  showMessage({
    title: 'Login Email',
    text: 'Email sent, proceed to enter code',
  })
  switchLoginStatus()
}
export const loginCode = async () => {
  const state = getState()
  const {email, code, loading} = state.user.loginDialog
  if (!email || !code || loading) return
  setState((state) => {
    state.user.loginDialog.loading = true
  })
  const res = await reqLoginCode(email, code)
  setState((state) => {
    state.user.loginDialog.loading = false
  })
  if (!res.success) {
    showMessage({
      title: 'Login Code Failed',
      text: res.error,
    })
    return
  }
  setState((state) => {
    state.user.accessToken = res.data.access_token
    state.user.email = email
  })
  showMessage({
    title: 'Login Code',
    text: 'Login successful',
  })
  closeLoginDialog()
}
