import {
  reqLoginCode,
  reqSendLoginCode,
  reqRegisterEmail,
  reqDeleteNotes,
  reqSendConfirmCode,
  reqLogout,
} from '../services/backend'
import {loadUser, storeUser} from '../services/localStorage'
import {showMessage} from './messages'
import {getState, setState, subscribe} from './store'
import {calcChecksum, isValidKeyTokenPair} from '../business/notesEncryption'
import {syncNotes} from './notes'
import {generateKey, generateSalt} from '../util/encryption'
import {db} from '../db'

export type UserState = {
  user: {
    email: string
    loggedIn: boolean
    lastSyncedTo: number
    keyTokenPair: {cryptoKey: string; syncToken: string} | null
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
  deleteServerNotesDialog: {
    open: boolean
    code: string
    codeLoading: boolean
    deleteLoading: boolean
  }
  impressumOpen: boolean
}

export const userInit: UserState = {
  user: {email: '', loggedIn: false, lastSyncedTo: 0, keyTokenPair: null},
  registerDialog: {open: false, email: '', loading: false},
  loginDialog: {open: false, email: '', code: '', loading: false, status: 'email'},
  syncDialog: {open: false, syncing: false},
  encryptionKeyDialog: {open: false, keyTokenPair: '', visible: false},
  deleteServerNotesDialog: {open: false, code: '', codeLoading: false, deleteLoading: false},
  impressumOpen: false,
}

// init
loadUser().then(async (user) => {
  if (user) {
    setState((s) => {
      s.user.user = user
    })
  }
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
export const openSyncDialogAndSync = () => {
  const state = getState()
  if (state.user.syncDialog.syncing || state.user.syncDialog.open) return
  setState((state) => {
    state.user.syncDialog.open = true
  })
  syncNotes()
}
export const closeSyncDialog = () =>
  setState((state) => {
    if (!state.user.syncDialog.open || state.user.syncDialog.syncing) return
    state.user.syncDialog.open = false
  })

export const openEncryptionKeyDialog = async () => {
  const state = getState()
  let keyTokenPair = state.user.user.keyTokenPair
  if (!keyTokenPair) {
    keyTokenPair = {cryptoKey: await generateKey(), syncToken: generateSalt(16)}
  }
  setState((state) => {
    const checksum = calcChecksum(keyTokenPair.cryptoKey, keyTokenPair.syncToken)
    state.user.encryptionKeyDialog = {
      open: true,
      keyTokenPair: `${keyTokenPair.cryptoKey}:${keyTokenPair.syncToken}:${checksum}`,
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
    state.user.user.keyTokenPair = {cryptoKey, syncToken}
    state.user.encryptionKeyDialog.open = false
  })
}

export const openDeleteServerNotesDialog = async () => {
  const state = getState()
  const loggedIn = state.user.user.loggedIn
  if (!loggedIn) return

  setState((s) => {
    s.user.deleteServerNotesDialog = {open: true, code: '', codeLoading: true, deleteLoading: false}
  })

  const res = await reqSendConfirmCode()

  setState((s) => {
    s.user.deleteServerNotesDialog.codeLoading = false
    if (!res.success && res.statusCode === 401) {
      s.user.user.loggedIn = false
    }
  })

  if (!res.success) {
    showMessage({
      title: 'Failed to send confirmation code',
      text: res.error,
    })
  } else {
    showMessage({
      title: 'Confirmation code sent',
      text: 'Check your email for the confirmation code',
    })
  }
}

export const closeDeleteServerNotesDialog = () =>
  setState((s) => {
    if (s.user.deleteServerNotesDialog.deleteLoading || s.user.deleteServerNotesDialog.codeLoading)
      return
    s.user.deleteServerNotesDialog.open = false
  })

export const deleteServerNotesCodeChanged = (code: string) =>
  setState((s) => {
    s.user.deleteServerNotesDialog.code = code
  })

export const deleteServerNotes = async () => {
  const state = getState()
  const {code, deleteLoading} = state.user.deleteServerNotesDialog
  const loggedIn = state.user.user.loggedIn
  if (!code || deleteLoading || !loggedIn) return

  setState((s) => {
    s.user.deleteServerNotesDialog.deleteLoading = true
  })

  const res = await reqDeleteNotes(code)

  setState((s) => {
    s.user.deleteServerNotesDialog.deleteLoading = false
    if (!res.success && res.statusCode === 401) {
      s.user.user.loggedIn = false
    }
    if (res.success) {
      s.user.deleteServerNotesDialog.open = false
      s.user.user.lastSyncedTo = 0
    }
  })

  const keys = await db.notes.toCollection().primaryKeys()
  await db.notes.bulkUpdate(keys.map((key) => ({key, changes: {state: 'dirty'}})))

  showMessage({
    title: res.success ? 'Success' : 'Failed to delete notes',
    text: res.success ? 'Server notes deleted' : res.error,
  })
}

// effects
export const registerEmail = async (captchaToken: string) => {
  const state = getState()
  const {email, loading} = state.user.registerDialog
  if (!email || loading) return
  setState((state) => {
    state.user.registerDialog.loading = true
  })
  const res = await reqRegisterEmail(email, captchaToken)
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
export const sendLoginCode = async () => {
  const state = getState()
  const {email, loading} = state.user.loginDialog
  if (!email || loading) return
  setState((state) => {
    state.user.loginDialog.loading = true
  })
  const res = await reqSendLoginCode(email)
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

export const toggleImpressum = () => {
  setState((state) => {
    state.user.impressumOpen = !state.user.impressumOpen
  })
}

// TODO: invalidate session on the server
export const logout = async () => {
  const state = getState()
  const loggedIn = state.user.user.loggedIn
  if (!loggedIn) return
  const res = await reqLogout()
  if (!res.success) {
    showMessage({title: 'Logout Failed', text: res.error})
  }
  setState((state) => {
    state.user.user.loggedIn = false
  })
}

// subscriptions
export const registerUserSubscriptions = () => {
  subscribe(
    (s) => s.user.user,
    (user) =>
      storeUser(user).catch((e) => showMessage({title: 'Store User Failed', text: e.message}))
  )
}
