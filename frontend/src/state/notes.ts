import {Note, NoteSortProp} from '../business/models'
import {getState, setState} from './store'
import {showMessage} from './messages'
import {downloadJson} from '../util/misc'
import {ImportNote, importNotesSchema} from '../business/importNotesSchema'
import {Delete, reqSyncNotes} from '../services/backend'
import {
  Create,
  decryptSyncData,
  encryptSyncData,
  SyncData,
  Update,
} from '../business/notesEncryption'
import {db} from '../db'

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
  if (!state.notes.openNote) return
  const note = await db.notes.get(state.notes.openNote.id)
  if (!note) return
  await db.notes.update(state.notes.openNote.id, {
    txt: state.notes.openNote.txt,
    updated_at: Date.now(),
    state: 'dirty',
    version: note.state === 'dirty' ? note.version : note.version + 1,
  })
  setState((s) => {
    s.notes.openNote = null
  })
}
export const addNote = async () => {
  const now = Date.now()

  const id = crypto.randomUUID()
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
  const syncToken = state.user.user.syncToken
  if (!state.user.user.loggedIn || state.user.syncDialog.syncing || !state.user.syncDialog.open) {
    return
  }
  setState((s) => {
    s.user.syncDialog.syncing = true
  })
  try {
    const dirtyNotes = await db.notes.where('state').equals('dirty').toArray()
    const clientCreates: Create[] = dirtyNotes
      .filter((n) => n.deleted_at === 0)
      .filter((n) => n.version === 1)
      .map((n) => ({id: n.id, created_at: n.created_at, txt: n.txt, updated_at: n.updated_at}))
    const clientUpdates: Update[] = dirtyNotes
      .filter((n) => n.deleted_at === 0)
      .filter((n) => n.version > 1)
      .map((n) => ({id: n.id, updated_at: n.updated_at, txt: n.txt, version: n.version}))
    const clientDeletes: Delete[] = dirtyNotes
      .filter((n) => n.deleted_at !== 0)
      .map((d) => ({id: d.id, deleted_at: d.deleted_at}))
    const clientSyncData: SyncData = {
      creates: clientCreates,
      updates: clientUpdates,
      deletes: clientDeletes,
    }
    const encClientSyncData = await encryptSyncData(state.user.user.cryptoKey, clientSyncData)

    const res = await reqSyncNotes(lastSyncedTo, encClientSyncData, syncToken)
    if (!res.success) {
      const loggedOut = res.statusCode === 401
      showMessage({title: 'Failed to sync notes', text: res.error})
      setState((s) => {
        s.user.syncDialog.syncing = false
        if (loggedOut) {
          s.user.user.loggedIn = false
        }
      })
      return
    }
    const syncData = await decryptSyncData(state.user.user.cryptoKey, res.data)
    const {creates, updates, deletes} = syncData

    await db.notes.bulkPut(
      creates.map((create) => ({
        id: create.id,
        created_at: create.created_at,
        updated_at: create.created_at,
        txt: create.txt,
        version: 1,
        state: 'synced',
        deleted_at: 0,
      }))
    )

    await db.notes.bulkUpdate(
      updates.map((update) => ({
        key: update.id,
        changes: {
          updated_at: update.updated_at,
          txt: update.txt,
          version: update.version,
          state: 'synced',
        },
      }))
    )

    await db.notes.bulkDelete(deletes.map((d) => d.id))

    setState((s) => {
      s.user.user.lastSyncedTo = res.data.synced_to
      s.user.syncDialog.syncing = false
      s.user.syncDialog.open = false
    })
    showMessage({title: 'Success', text: 'Notes synced'})
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
