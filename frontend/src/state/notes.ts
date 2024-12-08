import {createSelector} from 'reselect'
import {
  isDeletedNote,
  isNotDeletedNote,
  NotDeletedNote,
  Note,
  NoteSortProp,
} from '../business/models'
import {getState, RootState, setState, subscribe} from './store'
import {loadNotes, storeNotes} from '../services/localStorage'
import {showMessage} from './messages'
import {byProp, debounce, downloadJson, indexBy} from '../util/misc'
import {ImportNote, importNotesSchema} from '../business/importNotesSchema'
import {Delete, reqSyncNotes} from '../services/backend'
import {
  Create,
  decryptSyncData,
  encryptSyncData,
  SyncData,
  Update,
} from '../business/notesEncryption'

export type NotesState = {
  query: string
  notes: {[id: string]: Note}
  openNote: string | null
  sort: {prop: NoteSortProp; desc: boolean}
  importDialog: {
    open: boolean
    file: File | null
    error: string | null
  }
}

export const notesInit: NotesState = {
  query: '',
  notes: {},
  openNote: null,
  sort: {prop: 'created_at', desc: true},
  importDialog: {open: false, file: null, error: null},
}

// init
loadNotes().then((notes) =>
  setState((s) => {
    s.notes.notes = indexBy(notes, (n) => n.id)
  })
)

// actions
export const noteQueryChanged = (query: string) =>
  setState((s) => {
    s.notes.query = query
  })
export const openNote = (id: string) =>
  setState((s) => {
    s.notes.openNote = id
  })
export const closeNote = () =>
  setState((s) => {
    s.notes.openNote = null
  })
export const addNote = () => {
  const now = Date.now()
  setState((s) => {
    const id = crypto.randomUUID()
    s.notes.notes[id] = {
      id,
      txt: '',
      created_at: now,
      updated_at: now,
    }
    s.notes.openNote = id
  })
}
export const openNoteChanged = (txt: string) =>
  setState((s) => {
    if (s.notes.openNote && s.notes.notes[s.notes.openNote]) {
      s.notes.notes[s.notes.openNote]!.txt = txt
      s.notes.notes[s.notes.openNote]!.updated_at = Date.now()
    }
  })
export const sortChanged = (prop: NoteSortProp) =>
  setState((s) => {
    s.notes.sort.prop = prop
  })
export const sortDirectionChanged = () =>
  setState((s) => {
    s.notes.sort.desc = !s.notes.sort.desc
  })
export const deleteOpenNote = () =>
  setState((s) => {
    if (s.notes.openNote && s.notes.openNote in s.notes.notes) {
      s.notes.notes[s.notes.openNote]!.deleted_at = Date.now()
      s.notes.notes[s.notes.openNote]!.txt = undefined
      s.notes.openNote = null
    }
  })
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
export const exportNotes = () => {
  const notes: ImportNote[] = Object.values(getState().notes.notes).filter(isNotDeletedNote)
  downloadJson(notes, 'notes.json')
}
export const importNotes = async (): Promise<void> => {
  const state = getState()
  const file = state.notes.importDialog.file
  if (!file) {
    return
  }
  try {
    const importNotes = importNotesSchema.parse(JSON.parse(await file.text()))
    const res: NotDeletedNote[] = []
    for (const importNote of importNotes) {
      const now = Date.now()
      let {id} = importNote
      if (id === undefined) id = crypto.randomUUID()
      const {txt, updated_at = now} = importNote
      const existingNote = state.notes.notes[id]
      if (!existingNote || isDeletedNote(existingNote) || updated_at > existingNote.updated_at) {
        // ignore imported dates, since they would cause sync issues
        res.push({id, created_at: existingNote?.created_at ?? now, updated_at: now, txt})
      }
    }
    setState((s) => {
      for (const note of res) {
        s.notes.notes[note.id] = note
      }
    })
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
  const lastSync = state.user.user.lastNotesSync
  const accessToken = state.user.user.accessToken
  if (
    !state.user.user.accessToken ||
    state.user.syncDialog.syncing ||
    !state.user.syncDialog.open
  ) {
    return
  }
  setState((s) => {
    s.user.syncDialog.syncing = true
  })

  const notes = Object.values(state.notes.notes)
  const clientCreates: Create[] = notes
    .filter(isNotDeletedNote)
    .filter((n) => n.created_at > lastSync)
    .map((n) => ({id: n.id, created_at: n.created_at, txt: n.txt}))
  const clientUpdates: Update[] = notes
    .filter(isNotDeletedNote)
    .filter((n) => n.updated_at > lastSync && n.created_at < lastSync)
    .map((n) => ({id: n.id, updated_at: n.updated_at, txt: n.txt}))
  const clientDeletes: Delete[] = notes
    .filter(isDeletedNote)
    .filter((n) => n.deleted_at > lastSync)
    .map((d) => ({id: d.id, deleted_at: d.deleted_at}))
  const clientSyncData: SyncData = {
    creates: clientCreates,
    updates: clientUpdates,
    deletes: clientDeletes,
  }
  const encClientSyncData = await encryptSyncData(state.user.user.cryptoKey, clientSyncData)

  const res = await reqSyncNotes(lastSync, encClientSyncData, accessToken)
  if (!res.success) {
    showMessage({title: 'Error', text: 'Failed to sync notes'})
    setState((s) => {
      s.user.syncDialog.syncing = false
    })
    return
  }
  const syncData = await decryptSyncData(state.user.user.cryptoKey, res.data)
  const {creates, updates, deletes} = syncData
  setState((s) => {
    for (const create of creates) {
      s.notes.notes[create.id] = {
        id: create.id,
        created_at: create.created_at,
        updated_at: create.created_at,
        txt: create.txt,
      }
    }
    for (const update of updates) {
      if (update.id in s.notes.notes) {
        s.notes.notes[update.id]!.txt = update.txt
        s.notes.notes[update.id]!.updated_at = update.updated_at
      }
    }
    for (const del of deletes) {
      if (del.id in s.notes.notes) {
        s.notes.notes[del.id]!.deleted_at = del.deleted_at
      }
    }
    s.user.user.lastNotesSync = Date.now()
    s.user.syncDialog.syncing = false
    s.user.syncDialog.open = false
  })
  showMessage({title: 'Success', text: 'Notes synced'})
}

// selectors
export const selectFilteredNotes = createSelector(
  [
    (s: RootState) => s.notes.notes,
    (s: RootState) => s.notes.query,
    (s: RootState) => s.notes.sort,
  ],
  (notes, query, {prop, desc}): NotDeletedNote[] =>
    Object.values(notes)
      .filter(isNotDeletedNote)
      .filter((n) => !query || n.txt.includes(query))
      .sort(byProp(prop, desc))
)
export const selectOpenNote = createSelector(
  [(s: RootState) => s.notes.notes, (s: RootState) => s.notes.openNote],
  (notes, id): Note | undefined => (id ? notes[id] : undefined)
)

// subscriptions
const storeNotesDebounced = debounce(
  (notes: NotesState['notes']) =>
    storeNotes(Object.values(notes)).catch(() =>
      showMessage({title: 'Error', text: 'Failed to save notes'})
    ),
  1000
)

export const registerNotesSubscriptions = () => {
  subscribe(
    (s) => s.notes.notes,
    (notes) => storeNotesDebounced(notes)
  )
}
