import {Note, NoteSortProp} from '../business/models'
import {getState, selectAnyDialogOpen, setState, subscribe} from './store'
import {showMessage} from './messages'
import {debounce, delay, downloadJson, uuidV4WithoutCrypto} from '../util/misc'
import {ImportNote, importNotesSchema} from '../business/importNotesSchema'
import {reqSyncNotes} from '../services/backend'
import {Put, decryptSyncData, encryptSyncData} from '../business/notesEncryption'
import {db} from '../db'
import {loadOpenNote, storeOpenNote, storeOpenNoteSync} from '../services/localStorage'

export type NotesState = {
  query: string
  openNote: {id: string; txt: string} | null
  sort: {prop: NoteSortProp; desc: boolean}
  importDialog: {
    open: boolean
    file: File | null
    error: string | null
  }
}

export const notesInit: NotesState = {
  query: '',
  openNote: null,
  sort: {prop: 'created_at', desc: true},
  importDialog: {open: false, file: null, error: null},
}

// init
loadOpenNote()
  .then((openNote) => {
    setState((s) => {
      s.notes.openNote = openNote
    })
  })
  .then(() => delay(50))
  .then(() => {
    const state = getState()
    if (!state.notes.openNote && state.settings.settings.newNoteOnLaunch) {
      addNote()
    }

    window.addEventListener('focus', onFocus)
  })

const onFocus = debounce(() => {
  const state = getState()
  if (!selectAnyDialogOpen(state) && state.settings.settings.newNoteOnLaunch) {
    addNote()
  }
}, 10)

window.addEventListener('beforeunload', () => {
  storeOpenNoteSync(getState().notes.openNote)
})

// actions
export const noteQueryChanged = (query: string) =>
  setState((s) => {
    s.notes.query = query
  })
export const openNote = async (id: string) => {
  const note = await db.notes.get(id)
  if (!note || note.txt === null) return
  setState((s) => {
    s.notes.openNote = {id, txt: note.txt ?? ''}
  })
}
export const closeNote = async () => {
  const state = getState()
  const openNote = state.notes.openNote
  if (!openNote) return

  if (openNote.txt === '') {
    return await deleteOpenNote()
  }

  const note = await db.notes.get(openNote.id)
  if (note && note.txt !== openNote.txt) {
    await db.notes.update(openNote.id, {
      txt: openNote.txt,
      updated_at: Date.now(),
      state: 'dirty',
      version: note.state === 'dirty' ? note.version : note.version + 1,
    })
  }
  setState((s) => {
    s.notes.openNote = null
  })
}
export const addNote = async () => {
  const now = Date.now()

  const id = import.meta.env.DEV ? uuidV4WithoutCrypto() : crypto.randomUUID()
  const note: Note = {
    id,
    txt: '',
    version: 1,
    state: 'dirty',
    created_at: now,
    updated_at: now,
    deleted_at: 0,
  }
  await db.notes.add(note)
  setState((s) => {
    s.notes.openNote = {id, txt: ''}
  })
}
export const openNoteChanged = (txt: string) =>
  setState((s) => {
    if (!s.notes.openNote) return
    s.notes.openNote.txt = txt
  })
export const sortChanged = (prop: NoteSortProp) =>
  setState((s) => {
    s.notes.sort.prop = prop
  })
export const sortDirectionChanged = () =>
  setState((s) => {
    s.notes.sort.desc = !s.notes.sort.desc
  })
export const deleteOpenNote = async () => {
  const state = getState()
  if (!state.notes.openNote) return
  const note = await db.notes.get(state.notes.openNote.id)
  if (!note) return
  if (note.version === 1 && note.state === 'dirty') {
    await db.notes.delete(state.notes.openNote.id)
  } else {
    await db.notes.update(state.notes.openNote.id, {
      deleted_at: Date.now(),
      txt: '',
      state: 'dirty',
      version: note.state === 'dirty' ? note.version : note.version + 1,
    })
  }
  setState((s) => {
    s.notes.openNote = null
  })
}
export const openImportDialog = () =>
  setState((s) => {
    s.notes.importDialog = {open: true, file: null, error: null}
  })
export const closeImportDialog = () =>
  setState((s) => {
    s.notes.importDialog = {open: false, file: null, error: null}
  })
export const importFileChanged = (file: File | null) =>
  setState((s) => {
    s.notes.importDialog.file = file
    s.notes.importDialog.error = null
  })

// effects
export const exportNotes = async () => {
  const notes = await db.notes.where('deleted_at').equals(0).toArray()
  const notesToExport: ImportNote[] = notes.map((n) => ({
    id: n.id,
    txt: n.txt,
    created_at: n.created_at,
    updated_at: n.updated_at,
  }))
  downloadJson(notesToExport, 'notes.json')
}
export const importNotes = async (): Promise<void> => {
  const state = getState()
  const file = state.notes.importDialog.file
  if (!file) {
    return
  }
  try {
    const importNotes = importNotesSchema.parse(JSON.parse(await file.text()))
    const res: Note[] = []
    for (const importNote of importNotes) {
      const now = Date.now()
      let {id} = importNote
      if (id === undefined) id = crypto.randomUUID()
      const {txt, updated_at = now} = importNote
      const existingNote = await db.notes.get(id)
      if (!existingNote || existingNote.deleted_at !== 0 || updated_at > existingNote.updated_at) {
        res.push({
          id,
          created_at: existingNote?.created_at ?? now,
          updated_at: Math.max(updated_at, existingNote?.updated_at ?? 0),
          txt,
          state: 'dirty',
          version: !existingNote
            ? 1
            : existingNote.state === 'dirty'
            ? existingNote.version
            : existingNote.version + 1,
          deleted_at: 0,
        })
      }
    }
    await db.notes.bulkPut(res)
    closeImportDialog()
    showMessage({title: 'Success', text: 'Notes imported'})
  } catch (e) {
    setState((s) => {
      s.notes.importDialog.error = 'Invalid file format'
    })
  }
}
export const syncNotes = async () => {
  const state = getState()
  const lastSyncedTo = state.user.user.lastSyncedTo
  const keyTokenPair = state.user.user.keyTokenPair
  const session = state.user.user.session
  if (!keyTokenPair || !session || state.user.syncDialog.syncing || !state.user.syncDialog.open) {
    return
  }
  setState((s) => {
    s.user.syncDialog.syncing = true
  })
  try {
    const dirtyNotes = await db.notes.where('state').equals('dirty').toArray()
    const clientPuts: Put[] = dirtyNotes
      .map((n) => ({
        id: n.id,
        created_at: n.created_at,
        txt: n.deleted_at === 0 ? n.txt : null,
        updated_at: n.updated_at,
        version: n.version,
        deleted_at: n.deleted_at === 0 ? null : n.deleted_at,
      }))
      .filter(
        (p): p is typeof p & ({deleted_at: number; txt: null} | {deleted_at: null; txt: string}) =>
          (typeof p.deleted_at === 'number' && p.txt === null) ||
          (p.deleted_at === null && typeof p.txt === 'string')
      )
    const encClientSyncData = await encryptSyncData(keyTokenPair.cryptoKey, clientPuts)

    const res = await reqSyncNotes(session, lastSyncedTo, encClientSyncData, keyTokenPair.syncToken)
    if (!res.success) {
      const loggedOut = res.statusCode === 401
      showMessage({title: 'Failed to sync notes', text: res.error})
      setState((s) => {
        s.user.syncDialog.syncing = false
        if (loggedOut) {
          s.user.user.session = null
        }
      })
      return
    }
    const puts = await decryptSyncData(keyTokenPair.cryptoKey, res.data.puts)
    const conflicts = await decryptSyncData(keyTokenPair.cryptoKey, res.data.conflicts)

    await db.notes.bulkPut(
      puts.map((put) => ({
        id: put.id,
        created_at: put.created_at,
        updated_at: put.updated_at,
        txt: put.txt ?? '',
        version: put.version,
        state: 'synced',
        deleted_at: put.deleted_at ? put.deleted_at : 0,
      }))
    )

    const syncedDeletes = await db.notes
      .where('deleted_at')
      .notEqual(0)
      .and((n) => n.state === 'synced')
      .toArray()
    await db.notes.bulkDelete(syncedDeletes.map((d) => d.id))

    setState((s) => {
      s.conflicts.conflicts = conflicts
      s.user.user.lastSyncedTo = res.data.synced_to
      s.user.syncDialog.syncing = false
      s.user.syncDialog.open = false
    })
    showMessage({
      title: 'Success',
      text: `Notes synced with ${conflicts.length} conflicts`,
    })
  } catch (e) {
    setState((s) => {
      s.user.syncDialog.syncing = false
    })
    showMessage({
      title: 'Failed to sync notes',
      text: e instanceof Error ? e.message : 'Unknown error',
    })
  }
}

// subscriptions
export const registerNotesSubscriptions = () => {
  const openNoteSub = debounce(storeOpenNote, 100)
  subscribe((s) => s.notes.openNote, openNoteSub)
}
