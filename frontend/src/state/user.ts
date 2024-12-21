import {generateKey, generateSalt} from '../util/encryption'
import {reqLoginCode, reqLoginEmail, reqRegisterEmail} from '../services/backend'
import {loadUser, storeUser} from '../services/localStorage'
import {showMessage} from './messages'
import {getState, setState, subscribe} from './store'
import {calcChecksum, isValidKeyTokenPair} from '../business/notesEncryption'

export type UserState = {
  user: {
    email: string
    loggedIn: boolean
    lastNotesSync: number
    cryptoKey: string
    syncToken: string
  }
  registerDialog: {open: boolean; email: string; loading: boolean}
  loginDialog: {
    open: boolean
    email: string
    code: string
    loading: boolean
    status: 'email' | 'code'
  }
  syncDialog: {open: boolean; syncing: boolean}
  encryptionKeyDialog: {open: boolean; keyTokenPair: string; visible: boolean}
}

export const userInit: UserState = {
  user: {email: '', loggedIn: false, lastNotesSync: 0, cryptoKey: '', syncToken: ''},
  registerDialog: {open: false, email: '', loading: false},
  loginDialog: {open: false, email: '', code: '', loading: false, status: 'email'},
  syncDialog: {open: false, syncing: false},
  encryptionKeyDialog: {open: false, keyTokenPair: '', visible: false},
}

// init
loadUser().then(async (user) => {
  if (!user) {
    user = {...userInit.user}
  }
  if (!user.cryptoKey || !user.syncToken) {
    user.cryptoKey = await generateKey()
    user.syncToken = generateSalt(16)
  }
  setState((s) => {
    s.user.user = user
  })
})

// actions
export const registerEmailChanged = (email: string) => {
  setState((state) => {
    state.user.registerDialog.email = email
  })
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
export const openSyncDialog = () => {
  setState((state) => {
    state.user.syncDialog.open = true
  })
}
export const closeSyncDialog = () => {
  setState((state) => {
    state.user.syncDialog.open = false
  })
}
export const openEncryptionKeyDialog = () => {
  setState((state) => {
    const checksum = calcChecksum(state.user.user.cryptoKey, state.user.user.syncToken)
    state.user.encryptionKeyDialog = {
      open: true,
      keyTokenPair: `${state.user.user.cryptoKey}:${state.user.user.syncToken}:${checksum}`,
      visible: false,
    }
  })
}
export const toggleEncryptionKeyDialogVisibility = () => {
  setState((state) => {
    state.user.encryptionKeyDialog.visible = !state.user.encryptionKeyDialog.visible
  })
}
export const closeEncryptionKeyDialog = () => {
  setState((state) => {
    state.user.encryptionKeyDialog.open = false
  })
}
export const keyTokenPairChanged = (keyTokenPair: string) => {
  setState((state) => {
    state.user.encryptionKeyDialog.keyTokenPair = keyTokenPair
  })
}
export const saveEncryptionKey = async (keyTokenPair: string) => {
  if (!isValidKeyTokenPair(keyTokenPair)) return
  const [cryptoKey, syncToken] = keyTokenPair.split(':')
  if (!cryptoKey || !syncToken) return
  setState((state) => {
    state.user.user.cryptoKey = cryptoKey
    state.user.user.syncToken = syncToken
    state.user.encryptionKeyDialog.open = false
  })
}

// effects
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
    state.user.user.loggedIn = true
    state.user.user.email = email
  })
  showMessage({
    title: 'Login Code',
    text: 'Login successful',
  })
  closeLoginDialog()
}

// subscriptions
export const registerUserSubscriptions = () => {
  subscribe(
    (s) => s.user.user,
    (user) =>
      storeUser(user).catch((e) => showMessage({title: 'Store User Failed', text: e.message}))
  )
}
