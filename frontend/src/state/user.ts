import {generateKey} from '../business/notesEncryption'
import {reqLoginCode, reqLoginEmail, reqRegisterEmail} from '../services/backend'
import {loadUser, storeUser} from '../services/localStorage'
import {showMessage} from './messages'
import {getState, setState, subscribe} from './store'

export type UserState = {
  user: {
    email: string
    accessToken: string
    lastSync: number
    cryptoKey: string
  }
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
  user: {email: '', accessToken: '', lastSync: 0, cryptoKey: ''},
  registerDialog: {open: false, email: '', loading: false},
  loginDialog: {open: false, email: '', code: '', loading: false, status: 'email'},
}

// init
loadUser().then(async (user) => {
  if (!user) {
    user = userInit.user
  }
  if (!user.cryptoKey) {
    const key = await generateKey()
    user.cryptoKey = key
  }
  setState((s) => {
    s.user.user = user
  })
})

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
    state.user.user.email = email
    state.user.registerDialog.open = false
  })
  openLoginDialog()
}
export const openRegisterDialog = () => {
  setState((state) => {
    state.user.registerDialog = {open: true, email: state.user.user.email, loading: false}
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
      email: state.user.user.email,
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
    state.user.user.accessToken = res.data.access_token
    state.user.user.email = email
  })
  showMessage({
    title: 'Login Code',
    text: 'Login successful',
  })
  closeLoginDialog()
}

export const registerUserSubscriptions = () => {
  subscribe(
    (s) => s.user.user,
    (user) =>
      storeUser(user).catch((e) => showMessage({title: 'Store User Failed', text: e.message}))
  )
}
