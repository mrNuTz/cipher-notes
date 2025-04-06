import {Note, NoteHistoryItem, OpenNote, NoteSortProp} from '../business/models'
import {getState, selectAnyDialogOpen, setState, subscribe} from './store'
import {debounce, deepEquals, nonConcurrent} from '../util/misc'
import {isUnauthorizedRes, reqSyncNotes} from '../services/backend'
import {Put, decryptSyncData, encryptSyncData} from '../business/notesEncryption'
import {db, dirtyNotesObservable} from '../db'
import {
  mergeConflicts,
  notesIsEmpty,
  noteToPut,
  putToNote,
  textToTodos,
  todosHaveIdsAndUpdatedAt,
  todosToText,
} from '../business/misc'
import socket from '../socket'
import {loadNotesSortOrder, storeNotesSortOrder} from '../services/localStorage'
import {showMessage} from './messages'

export type NotesState = {
  query: string
  openNote: OpenNote | null
  sort: {prop: NoteSortProp; desc: boolean}
  sync: {
    dialogOpen: boolean
    syncing: boolean
    error: string | null
    storing: boolean
  }
}

export const notesInit: NotesState = {
  query: '',
  openNote: null,
  sort: {prop: 'created_at', desc: true},
  sync: {dialogOpen: false, syncing: false, error: null, storing: false},
}

// init
loadNotesSortOrder().then((sort) => {
  if (sort) {
    setState((state) => {
      state.notes.sort = sort
    })
  }
})

new Promise((resolve) => window.addEventListener('DOMContentLoaded', resolve)).then(() => {
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

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'hidden') {
    await storeOpenNote()
    await syncNotes()
  }
})

// actions
export const noteQueryChanged = (query: string) =>
  setState((state) => {
    state.notes.query = query
  })
export const noteOpened = async (id: string) => {
  const note = await db.notes.get(id)
  if (!note || note.deleted_at !== 0) return
  setState((state) => {
    if (note.type === 'todo') {
      state.notes.openNote = {
        type: 'todo',
        id,
        todos: note.todos,
        title: note.title,
        updatedAt: note.updated_at,
      }
    } else {
      state.notes.openNote = {
        type: 'note',
        id,
        txt: note.txt,
        title: note.title,
        updatedAt: note.updated_at,
      }
    }
  })
  // TODO: remove this; second set state triggers storeOpenNote which triggers a sync
  if (note.type === 'todo' && !todosHaveIdsAndUpdatedAt(note.todos)) {
    setState((state) => {
      if (!state.notes.openNote) return
      state.notes.openNote.todos = note.todos.map(({id, updated_at, ...t}) => ({
        ...t,
        id: id ?? crypto.randomUUID(),
        updated_at: updated_at ?? Date.now(),
      }))
    })
  }
}
export const noteClosed = async () => {
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

  await storeOpenNote()

  setState((state) => {
    state.notes.openNote = null
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
    type: 'note',
    title: '',
  }
  await db.notes.add(note)

  setState((state) => {
    state.notes.openNote = {type: 'note', id, txt: '', title: '', updatedAt: now}
  })
}
export const openNoteTitleChanged = (title: string) =>
  setState((state) => {
    if (!state.notes.openNote) return
    state.notes.openNote.title = title
    state.notes.openNote.updatedAt = Date.now()
  })
export const openNoteTxtChanged = (txt: string) =>
  setState((state) => {
    if (!state.notes.openNote) return
    state.notes.openNote.txt = txt
    state.notes.openNote.updatedAt = Date.now()
  })
export const openNoteTypeToggled = () =>
  setState((state) => {
    if (!state.notes.openNote) return
    if (state.notes.openNote.type === 'note') {
      state.notes.openNote = {
        type: 'todo',
        id: state.notes.openNote.id,
        todos: textToTodos(state.notes.openNote.txt),
        title: state.notes.openNote.title,
        updatedAt: Date.now(),
      }
    } else {
      state.notes.openNote = {
        type: 'note',
        id: state.notes.openNote.id,
        txt: todosToText(state.notes.openNote.todos),
        title: state.notes.openNote.title,
        updatedAt: Date.now(),
      }
    }
  })

export const todoChecked = (index: number, checked: boolean) =>
  setState((state) => {
    if (
      !state.notes.openNote ||
      state.notes.openNote.type !== 'todo' ||
      !state.notes.openNote.todos[index]
    )
      return
    state.notes.openNote.todos[index].done = checked
    state.notes.openNote.todos[index].updated_at = Date.now()
    state.notes.openNote.updatedAt = Date.now()
  })
export const todoChanged = (index: number, txt: string) =>
  setState((state) => {
    if (
      !state.notes.openNote ||
      state.notes.openNote.type !== 'todo' ||
      !state.notes.openNote.todos[index]
    )
      return
    state.notes.openNote.todos[index].txt = txt
    state.notes.openNote.todos[index].updated_at = Date.now()
    state.notes.openNote.updatedAt = Date.now()
  })
export const insertTodo = (bellow: number) =>
  setState((state) => {
    if (!state.notes.openNote || state.notes.openNote.type !== 'todo') return
    state.notes.openNote.todos.splice(bellow + 1, 0, {
      txt: '',
      done: false,
      id: crypto.randomUUID(),
      updated_at: Date.now(),
    })
    state.notes.openNote.updatedAt = Date.now()
  })
export const deleteTodo = (index: number) =>
  setState((state) => {
    if (!state.notes.openNote || state.notes.openNote.type !== 'todo') return
    state.notes.openNote.todos.splice(index, 1)
    state.notes.openNote.updatedAt = Date.now()
  })
export const moveTodo = (source: number, target: number) =>
  setState((state) => {
    if (!state.notes.openNote || state.notes.openNote.type !== 'todo') return
    const todos = state.notes.openNote.todos
    const [todo] = todos.splice(source, 1)
    if (todo) {
      todos.splice(target, 0, todo)
    }
    state.notes.openNote.updatedAt = Date.now()
  })
export const openNoteHistoryHandler = (historyItem: NoteHistoryItem | null) => {
  if (!historyItem) {
    return
  }
  setState((state) => {
    if (!state.notes.openNote) return
    if (historyItem.type === 'note') {
      state.notes.openNote.type = 'note'
      state.notes.openNote.txt = historyItem.txt
    } else {
      state.notes.openNote.type = 'todo'
      state.notes.openNote.todos = historyItem.todos
    }
    state.notes.openNote.updatedAt = Date.now()
  })
}
export const sortChanged = (prop: NoteSortProp) =>
  setState((state) => {
    state.notes.sort.prop = prop
  })
export const sortDirectionChanged = () =>
  setState((state) => {
    state.notes.sort.desc = !state.notes.sort.desc
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
  setState((state) => {
    state.notes.openNote = null
  })
}
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
let modifiedWhileBetween: string[] = []
let betweenLoadAndStore = false

export const syncNotes = nonConcurrent(async () => {
  const state = getState()
  const lastSyncedTo = state.user.user.lastSyncedTo
  const keyTokenPair = state.user.user.keyTokenPair
  const loggedIn = state.user.user.loggedIn
  if (!keyTokenPair || !loggedIn || state.notes.sync.syncing) {
    return
  }
  setState((state) => {
    state.notes.sync.syncing = true
  })
  try {
    betweenLoadAndStore = true
    const dirtyNotes = await db.notes
      .where('state')
      .equals('dirty')
      .and((n) => !notesIsEmpty(n))
      .toArray()
    const clientPuts: Put[] = dirtyNotes.map(noteToPut)
    const encClientSyncData = await encryptSyncData(keyTokenPair.cryptoKey, clientPuts)

    const res = await reqSyncNotes(lastSyncedTo, encClientSyncData, keyTokenPair.syncToken)
    if (!res.success) {
      setState((state) => {
        state.notes.sync.error = res.error
        if (isUnauthorizedRes(res)) {
          state.user.user.loggedIn = false
        }
        if (state.notes.sync.dialogOpen) {
          showMessage(state, {title: 'Failed to sync notes', text: res.error})
        }
      })
      return
    }
    const pulls = await decryptSyncData(keyTokenPair.cryptoKey, res.data.puts)
    const serverConflicts = await decryptSyncData(keyTokenPair.cryptoKey, res.data.conflicts)

    const baseVersions = await db.note_base_versions
      .where('id')
      .anyOf(serverConflicts.map((n) => n.id))
      .toArray()
    const {merged, conflicts} = mergeConflicts(
      baseVersions,
      dirtyNotes,
      serverConflicts.map(putToNote)
    )

    const toStore = pulls
      .map(putToNote)
      .concat(merged)
      .filter((p) => !modifiedWhileBetween.includes(p.id))
    const modifiedTwice = modifiedWhileBetween.filter((id) => dirtyNotes.some((n) => n.id === id))
    betweenLoadAndStore = false
    modifiedWhileBetween = []
    await db.transaction('rw', db.notes, db.note_base_versions, async () => {
      await db.notes.bulkPut(toStore)
      await db.note_base_versions.bulkPut(toStore.filter((n) => n.state === 'synced'))
      await db.notes
        .where('id')
        .anyOf(modifiedTwice)
        .modify((n) => {
          n.version = n.version + 1
        })
    })

    setOpenNote(toStore)

    const syncedDeletes = await db.notes
      .where('deleted_at')
      .notEqual(0)
      .and((n) => n.state === 'synced')
      .toArray()
    const syncedDeleteIds = syncedDeletes.map((d) => d.id)
    await db.notes.bulkDelete(syncedDeleteIds)
    await db.note_base_versions.bulkDelete(syncedDeleteIds)

    setState((state) => {
      state.conflicts.conflicts = conflicts
      state.user.user.lastSyncedTo = res.data.synced_to
      state.notes.sync.error = null
      if (state.notes.sync.dialogOpen) {
        showMessage(state, {
          title: 'Success',
          text: `Notes synced with ${serverConflicts.length} conflicts`,
        })
      }
    })
  } catch (e) {
    setState((state) => {
      const message = e instanceof Error ? e.message : 'Unknown error'
      state.notes.sync.error = message
      if (state.notes.sync.dialogOpen) {
        showMessage(state, {
          title: 'Failed to sync notes',
          text: message,
        })
      }
    })
  } finally {
    setState((state) => {
      state.notes.sync.syncing = false
    })
    betweenLoadAndStore = false
    modifiedWhileBetween = []
  }
})

const setOpenNote = (syncedNotes: Note[]) => {
  const openNote = getState().notes.openNote
  if (!openNote) {
    return
  }
  const note = syncedNotes.find((n) => n.id === openNote.id)
  if (!note) {
    return
  }
  if (note.deleted_at !== 0) {
    return setState((state) => {
      state.notes.openNote = null
    })
  }
  // TODO: handle clock differences between clients
  if (note.updated_at > openNote.updatedAt) {
    setState((state) => {
      state.notes.openNote =
        note.type === 'note'
          ? {
              type: note.type,
              id: note.id,
              title: note.title,
              txt: note.txt,
              updatedAt: note.updated_at,
            }
          : {
              type: note.type,
              id: note.id,
              title: note.title,
              todos: note.todos,
              updatedAt: note.updated_at,
            }
    })
  }
}

const storeOpenNote = nonConcurrent(async () => {
  const openNote = getState().notes.openNote
  if (!openNote) return

  const note = await db.notes.get(openNote.id)

  if (
    note &&
    (note.title !== openNote.title ||
      note.type !== openNote.type ||
      (note.type === 'note' && note.txt !== openNote.txt) ||
      (note.type === 'todo' && !deepEquals(note.todos, openNote.todos)))
  ) {
    if (betweenLoadAndStore) {
      modifiedWhileBetween.push(openNote.id)
    }
    await db.notes.update(openNote.id, {
      type: openNote.type,
      title: openNote.title,
      txt: openNote.type === 'note' ? openNote.txt : undefined,
      todos: openNote.type === 'todo' ? openNote.todos : undefined,
      updated_at: openNote.updatedAt,
      state: 'dirty',
      version: note.state === 'dirty' ? note.version : note.version + 1,
    })
  }
})

// subscriptions
export const registerNotesSubscriptions = () => {
  const storeOpenNoteDebounced = debounce(storeOpenNote, 1000)

  subscribe((state) => state.notes.sort, storeNotesSortOrder)
  subscribe(
    (state) => state.notes.openNote,
    (curr, prev) => curr && prev && storeOpenNoteDebounced()
  )
  subscribe(
    (state) => state.conflicts.conflicts.length !== 0,
    (hasConflicts) => {
      if (hasConflicts) {
        noteClosed()
      }
    }
  )
  subscribe(
    (state) => state.user.user.loggedIn,
    (curr, prev) => {
      if (!prev && curr) {
        syncNotes()
      }
    }
  )

  const syncNotesDebounced = debounce(syncNotes, 1000)

  dirtyNotesObservable.subscribe((dirty) => {
    if (dirty.length > 0 && !dirty.every(notesIsEmpty)) {
      syncNotesDebounced()
    }
  })

  socket.on('notesPushed', () => {
    syncNotes()
  })
}
