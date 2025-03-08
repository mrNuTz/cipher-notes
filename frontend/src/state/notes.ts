import {Note, NoteHistoryItem, OpenNote, NoteSortProp} from '../business/models'
import {getState, selectAnyDialogOpen, setState, subscribe} from './store'
import {showMessage} from './messages'
import {debounce, deepEquals, delay, downloadJson, uuidV4WithoutCrypto} from '../util/misc'
import {ImportNote, importNotesSchema} from '../business/importNotesSchema'
import {reqSyncNotes} from '../services/backend'
import {Put, decryptSyncData, encryptSyncData} from '../business/notesEncryption'
import {db, dirtyNotesObservable} from '../db'
import {loadOpenNote, storeOpenNote, storeOpenNoteSync} from '../services/localStorage'
import {noteToPut, putToNote, textToTodos, todosToText} from '../business/misc'

export type NotesState = {
  query: string
  openNote: OpenNote | null
  sort: {prop: NoteSortProp; desc: boolean}
  importDialog: {
    open: boolean
    file: File | null
    error: string | null
  }
  sync: {
    dialogOpen: boolean
    syncing: boolean
    error: string | null
  }
}

export const notesInit: NotesState = {
  query: '',
  openNote: null,
  sort: {prop: 'created_at', desc: true},
  importDialog: {open: false, file: null, error: null},
  sync: {dialogOpen: false, syncing: false, error: null},
}

// init
new Promise((resolve) => window.addEventListener('DOMContentLoaded', resolve))
  .then(() => history.replaceState({dialogOpen: false}, '', location.href))
  .then(() => delay(10))
  .then(loadOpenNote)
  .then(
    (openNote) =>
      setState((s) => {
        s.notes.openNote = openNote
      }),
    (err) =>
      showMessage({
        title: 'Restore Open Note Failed',
        text: err instanceof Error ? err.message : 'Unknown error',
      })
  )
  .then(() => delay(10))
  .then(() => {
    onFocus()
    window.addEventListener('focus', onFocus)
  })

const onFocus = debounce(() => {
  const state = getState()
  if (!selectAnyDialogOpen(state) && state.settings.settings.newNoteOnLaunch) {
    addNote()
  }
  syncNotes()
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
    if (note.type === 'todo') {
      s.notes.openNote = {type: 'todo', id, todos: note.todos, title: note.title}
    } else {
      s.notes.openNote = {type: 'note', id, txt: note.txt, title: note.title}
    }
  })
}
let modifiedWhileSyncingIds: string[] = []
export const openNoteClosed = async () => {
  const state = getState()
  const openNote = state.notes.openNote
  if (!openNote) return

  if (
    openNote.title === '' &&
    (openNote.type === 'todo'
      ? openNote.todos.length === 0 ||
        (openNote.todos.length === 1 && openNote.todos[0]!.txt === '')
      : openNote.txt === '')
  ) {
    return await deleteOpenNote()
  }

  const note = await db.notes.get(openNote.id)
  if (
    note &&
    (note.title !== openNote.title ||
      (note.type === 'note' && note.txt !== openNote.txt) ||
      (note.type === 'todo' && !deepEquals(note.todos, openNote.todos)))
  ) {
    if (getState().notes.sync.syncing) {
      modifiedWhileSyncingIds.push(openNote.id)
    }
    await db.notes.update(openNote.id, {
      type: openNote.type,
      title: openNote.title,
      txt: openNote.type === 'note' ? openNote.txt : undefined,
      todos: openNote.type === 'todo' ? openNote.todos : undefined,
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
    type: 'note',
    title: '',
  }
  await db.notes.add(note)

  setState((s) => {
    s.notes.openNote = {type: 'note', id, txt: '', title: ''}
  })
}
export const openNoteTitleChanged = (title: string) =>
  setState((s) => {
    if (!s.notes.openNote) return
    s.notes.openNote.title = title
  })
export const openNoteTxtChanged = (txt: string) =>
  setState((s) => {
    if (!s.notes.openNote) return
    s.notes.openNote.txt = txt
  })
export const openNoteTypeToggled = () =>
  setState((s) => {
    if (!s.notes.openNote) return
    if (s.notes.openNote.type === 'note') {
      s.notes.openNote = {
        type: 'todo',
        id: s.notes.openNote.id,
        todos: textToTodos(s.notes.openNote.txt),
        title: s.notes.openNote.title,
      }
    } else {
      s.notes.openNote = {
        type: 'note',
        id: s.notes.openNote.id,
        txt: todosToText(s.notes.openNote.todos),
        title: s.notes.openNote.title,
      }
    }
  })

export const todoChecked = (index: number, checked: boolean) =>
  setState((s) => {
    if (!s.notes.openNote || s.notes.openNote.type !== 'todo' || !s.notes.openNote.todos[index])
      return
    s.notes.openNote.todos[index].done = checked
  })
export const todoChanged = (index: number, txt: string) =>
  setState((s) => {
    if (!s.notes.openNote || s.notes.openNote.type !== 'todo' || !s.notes.openNote.todos[index])
      return
    s.notes.openNote.todos[index].txt = txt
  })
export const insertTodo = (bellow: number) =>
  setState((s) => {
    if (!s.notes.openNote || s.notes.openNote.type !== 'todo') return
    s.notes.openNote.todos.splice(bellow + 1, 0, {txt: '', done: false})
  })
export const deleteTodo = (index: number) =>
  setState((s) => {
    if (!s.notes.openNote || s.notes.openNote.type !== 'todo') return
    s.notes.openNote.todos.splice(index, 1)
  })
export const moveTodo = (source: number, target: number) =>
  setState((s) => {
    if (!s.notes.openNote || s.notes.openNote.type !== 'todo') return
    const todos = s.notes.openNote.todos
    const [todo] = todos.splice(source, 1)
    if (todo) {
      todos.splice(target, 0, todo)
    }
  })
export const openNoteHistoryHandler = (historyItem: NoteHistoryItem) =>
  setState((s) => {
    if (!s.notes.openNote) return
    if (historyItem.type === 'note') {
      s.notes.openNote.type = 'note'
      s.notes.openNote.txt = historyItem.txt
    } else {
      s.notes.openNote.type = 'todo'
      s.notes.openNote.todos = historyItem.todos
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
export const openSyncDialogAndSync = () => {
  const state = getState()
  if (state.notes.sync.syncing || state.notes.sync.dialogOpen) return
  setState((state) => {
    state.notes.sync.dialogOpen = true
  })
  syncNotes()
}
export const closeSyncDialog = () =>
  setState((state) => {
    state.notes.sync.dialogOpen = false
  })

// effects
export const exportNotes = async () => {
  const notes = await db.notes.where('deleted_at').equals(0).toArray()
  const notesToExport: ImportNote[] = notes.map((n) => ({
    id: n.id,
    txt: n.txt,
    title: n.title,
    created_at: n.created_at,
    updated_at: n.updated_at,
    todos: n.todos,
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
      if (id === undefined) {
        id = crypto.randomUUID()
      }
      const {txt, updated_at = now, todos, title} = importNote
      if (todos === undefined && txt === undefined) {
        continue
      }
      const type = todos ? 'todo' : 'note'
      const existingNote = await db.notes.get(id)
      if (!existingNote || existingNote.deleted_at !== 0 || updated_at > existingNote.updated_at) {
        const indeterminate = {
          id,
          created_at: existingNote?.created_at ?? now,
          updated_at: Math.max(updated_at, existingNote?.updated_at ?? 0),
          txt,
          state: 'dirty',
          type,
          title: title ?? '',
          version: !existingNote
            ? 1
            : existingNote.state === 'dirty'
            ? existingNote.version
            : existingNote.version + 1,
          deleted_at: 0,
          todos: todos,
        } as const
        if (indeterminate.todos) {
          res.push({...indeterminate, type: 'todo', todos: indeterminate.todos, txt: undefined})
        } else if (indeterminate.txt) {
          res.push({...indeterminate, type: 'note', txt: indeterminate.txt, todos: undefined})
        }
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
  const loggedIn = state.user.user.loggedIn
  if (!keyTokenPair || !loggedIn || state.notes.sync.syncing) {
    return
  }
  setState((s) => {
    s.notes.sync.syncing = true
  })
  try {
    const dirtyNotes = await db.notes.where('state').equals('dirty').toArray()
    const clientPuts: Put[] = dirtyNotes.map(noteToPut)
    const encClientSyncData = await encryptSyncData(keyTokenPair.cryptoKey, clientPuts)

    const res = await reqSyncNotes(lastSyncedTo, encClientSyncData, keyTokenPair.syncToken)
    if (!res.success) {
      setState((s) => {
        s.notes.sync.error = res.error
        if (res.statusCode === 401) {
          s.user.user.loggedIn = false
        }
        if (s.notes.sync.dialogOpen) {
          s.messages.messages.push({title: 'Failed to sync notes', text: res.error})
        }
      })
      return
    }
    const pulls = await decryptSyncData(keyTokenPair.cryptoKey, res.data.puts)
    const conflicts = await decryptSyncData(keyTokenPair.cryptoKey, res.data.conflicts)
    await db.notes.bulkPut(
      pulls.map(putToNote).filter((n) => !modifiedWhileSyncingIds.includes(n.id))
    )
    modifiedWhileSyncingIds = []

    const syncedDeletes = await db.notes
      .where('deleted_at')
      .notEqual(0)
      .and((n) => n.state === 'synced')
      .toArray()
    await db.notes.bulkDelete(syncedDeletes.map((d) => d.id))

    setState((s) => {
      s.conflicts.conflicts = conflicts
      s.user.user.lastSyncedTo = res.data.synced_to
      s.notes.sync.error = null
      if (s.notes.sync.dialogOpen) {
        s.messages.messages.push({
          title: 'Success',
          text: `Notes synced with ${conflicts.length} conflicts`,
        })
      }
    })
  } catch (e) {
    setState((s) => {
      s.notes.sync.error = e instanceof Error ? e.message : 'Unknown error'
      if (s.notes.sync.dialogOpen) {
        s.messages.messages.push({
          title: 'Failed to sync notes',
          text: e instanceof Error ? e.message : 'Unknown error',
        })
      }
    })
  } finally {
    setState((s) => {
      s.notes.sync.syncing = false
    })
  }
}

// subscriptions
export const registerNotesSubscriptions = () => {
  const openNoteSub = debounce(storeOpenNote, 100)
  subscribe((s) => s.notes.openNote, openNoteSub)

  const syncNotesDebounced = debounce(syncNotes, 100)
  dirtyNotesObservable.subscribe((dirty) => {
    if (dirty.length > 0) {
      syncNotesDebounced()
    }
  })
}
