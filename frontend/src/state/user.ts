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
import {generateKey, generateSalt} from '../util/encryption'
import {db} from '../db'
import socket from '../socket'

export type UserState = {
  user: {
    email: string
    loggedIn: boolean
    lastSyncedTo: number
    keyTokenPair: {cryptoKey: string; syncToken: string} | null
  }
  connected: boolean
  registerDialog: {open: boolean; email: string; loading: boolean}
  loginDialog: {
    open: boolean
    email: string
    code: string
    loading: boolean
    status: 'email' | 'code'
  }
  encryptionKeyDialog: {
    open: boolean
    keyTokenPair: string
    visible: boolean
    qrMode: 'hide' | 'show' | 'scan'
  }
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
  connected: false,
  registerDialog: {open: false, email: '', loading: false},
  loginDialog: {open: false, email: '', code: '', loading: false, status: 'email'},
  encryptionKeyDialog: {open: false, keyTokenPair: '', visible: false, qrMode: 'hide'},
  deleteServerNotesDialog: {open: false, code: '', codeLoading: false, deleteLoading: false},
  impressumOpen: false,
}

// init
loadUser().then(async (user) => {
  if (user) {
    setState((state) => {
      state.user.user = user
    })
  }
  if (user?.loggedIn && !socket.connected) {
    socket.connect()
  }
})
window.addEventListener('focus', () => {
  setState((state) => {
    state.user.connected = socket.connected
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
export const socketConnectionChanged = (connected: boolean) => {
  setState((state) => {
    state.user.connected = connected
  })
}

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
      qrMode: 'hide',
    }
  })
}
export const toggleEncryptionKeyDialogVisibility = () => {
  setState((state) => {
    state.user.encryptionKeyDialog.visible = !state.user.encryptionKeyDialog.visible
  })
}
export const qrModeChanged = (qrMode: 'hide' | 'show' | 'scan') => {
  setState((state) => {
    state.user.encryptionKeyDialog.qrMode = qrMode
  })
}
export const closeEncryptionKeyDialog = () => {
  setState((state) => {
    state.user.encryptionKeyDialog = userInit.encryptionKeyDialog
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

  const oldKeyTokenPair = getState().user.user.keyTokenPair
  const isNewKey =
    oldKeyTokenPair?.cryptoKey !== cryptoKey || oldKeyTokenPair?.syncToken !== syncToken
  if (isNewKey) {
    const deletedNoteIds = await db.notes.where('deleted_at').notEqual(0).primaryKeys()
    await db.notes.bulkDelete(deletedNoteIds)

    const keys = await db.notes.toCollection().primaryKeys()
    await db.notes.bulkUpdate(keys.map((key) => ({key, changes: {state: 'dirty'}})))
  }
  setState((state) => {
    if (isNewKey) {
      state.user.user.lastSyncedTo = 0
      state.user.user.keyTokenPair = {cryptoKey, syncToken}
    }
    state.user.encryptionKeyDialog.open = false
  })
}

export const openDeleteServerNotesDialog = async () => {
  const state = getState()
  const loggedIn = state.user.user.loggedIn
  if (!loggedIn) return

  setState((state) => {
    state.user.deleteServerNotesDialog = {
      open: true,
      code: '',
      codeLoading: true,
      deleteLoading: false,
    }
  })

  const res = await reqSendConfirmCode()

  setState((state) => {
    state.user.deleteServerNotesDialog.codeLoading = false
    if (!res.success && res.statusCode === 401) {
      state.user.user.loggedIn = false
    }
    if (!res.success) {
      showMessage(state, {
        title: 'Failed to send confirmation code',
        text: res.error,
      })
    } else {
      showMessage(state, {
        title: 'Confirmation code sent',
        text: 'Check your email for the confirmation code',
      })
    }
  })
}

export const closeDeleteServerNotesDialog = () =>
  setState((state) => {
    if (
      state.user.deleteServerNotesDialog.deleteLoading ||
      state.user.deleteServerNotesDialog.codeLoading
    )
      return
    state.user.deleteServerNotesDialog.open = false
  })

export const deleteServerNotesCodeChanged = (code: string) =>
  setState((state) => {
    state.user.deleteServerNotesDialog.code = code
  })

export const deleteServerNotesAndGenerateNewKey = async () => {
  const state = getState()
  const {code, deleteLoading} = state.user.deleteServerNotesDialog
  const loggedIn = state.user.user.loggedIn
  if (!code || deleteLoading || !loggedIn) return

  setState((state) => {
    state.user.deleteServerNotesDialog.deleteLoading = true
  })

  const res = await reqDeleteNotes(code)

  if (!res.success) {
    return setState((state) => {
      state.user.deleteServerNotesDialog.deleteLoading = false
      if (res.statusCode === 401) {
        state.user.user.loggedIn = false
      }
      showMessage(state, {
        title: 'Failed to delete notes',
        text: res.error,
      })
    })
  }

  const deletedNotes = await db.notes.where('deleted_at').notEqual(0).toArray()
  await db.notes.bulkDelete(deletedNotes.map((note) => note.id))

  const keys = await db.notes.toCollection().primaryKeys()
  await db.notes.bulkUpdate(keys.map((key) => ({key, changes: {state: 'dirty'}})))

  const cryptoKey = await generateKey()
  setState((state) => {
    state.user.deleteServerNotesDialog.deleteLoading = false
    state.user.deleteServerNotesDialog.open = false
    state.user.user.lastSyncedTo = 0
    state.user.user.keyTokenPair = {cryptoKey, syncToken: generateSalt(16)}
    showMessage(state, {
      title: 'Success',
      text: 'Server notes deleted and new crypto key generated',
    })
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
    if (!res.success) {
      showMessage(state, {
        title: 'Register Email Failed',
        text: res.error,
      })
    } else {
      showMessage(state, {
        title: 'Register Email',
        text: 'Email registered, proceed to login',
      })
      state.user.user.email = email
      state.user.registerDialog.open = false
      state.user.loginDialog = {
        open: true,
        email: state.user.user.email,
        code: '',
        loading: false,
        status: 'email',
      }
    }
  })
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
    if (!res.success) {
      showMessage(state, {
        title: 'Login Email Failed',
        text: res.error,
      })
    } else {
      showMessage(state, {
        title: 'Login Email',
        text: 'Email sent, proceed to enter code',
      })
      state.user.loginDialog.status = 'code'
    }
  })
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
    if (!res.success) {
      showMessage(state, {
        title: 'Login with code failed',
        text: res.error,
      })
    } else {
      state.user.user.loggedIn = true
      state.user.user.email = email
      showMessage(state, {
        title: 'Success',
        text: 'You are logged in',
      })
      state.user.loginDialog.open = false
    }
  })
}

export const toggleImpressum = () => {
  setState((state) => {
    state.user.impressumOpen = !state.user.impressumOpen
  })
}

export const logout = async () => {
  const state = getState()
  const loggedIn = state.user.user.loggedIn
  if (!loggedIn) return
  const res = await reqLogout()
  setState((state) => {
    if (!res.success) {
      showMessage(state, {title: 'Logout Failed', text: res.error})
    } else {
      state.user.user.loggedIn = false
    }
  })
}

// subscriptions
export const registerUserSubscriptions = () => {
  subscribe(
    (state) => state.user.user,
    (user) =>
      storeUser(user).catch((e) =>
        setState((state) => showMessage(state, {title: 'Store User Failed', text: e.message}))
      )
  )
  subscribe(
    (state) => state.user.user.loggedIn,
    (loggedIn) => {
      if (loggedIn && !socket.connected) {
        socket.connect()
      } else if (!loggedIn && socket.connected) {
        socket.disconnect()
      }
    }
  )
}
