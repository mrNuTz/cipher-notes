import {createSelector} from 'reselect'
import {generateId} from '../business/generateId'
import {Note, NoteSortProp} from '../business/models'
import {getState, RootState, setState, subscribe} from './store'
import {loadNotes, storeNotes} from '../services/notesStorage'
import {showMessage} from './messages'
import {byProp, debounce, downloadJson, indexBy} from '../util/misc'
import {importNotesSchema} from '../business/importNotesSchema'

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
  sort: {prop: 'created', desc: true},
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
export const addNote = () =>
  setState((s) => {
    const id = generateId()
    s.notes.notes[id] = {id, txt: '', created: Date.now(), modified: Date.now()}
    s.notes.openNote = id
  })
export const deleteNote = (id: string) =>
  setState((s) => {
    delete s.notes.notes[id]
  })
export const openNoteChanged = (txt: string) =>
  setState((s) => {
    if (s.notes.openNote && s.notes.notes[s.notes.openNote]) {
      s.notes.notes[s.notes.openNote]!.txt = txt
      s.notes.notes[s.notes.openNote]!.modified = Date.now()
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
export const removeOpenNote = () =>
  setState((s) => {
    if (s.notes.openNote) {
      delete s.notes.notes[s.notes.openNote]
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
  const notes = Object.values(getState().notes.notes)
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
    const res: Note[] = []
    for (const importNote of importNotes) {
      let {id, created, modified} = importNote
      const {txt} = importNote
      if (id === undefined) id = generateId()
      if (created === undefined) created = Date.now()
      if (modified === undefined) modified = Date.now()
      const newNote: Note = {created, id, modified, txt}
      const existingNote = state.notes.notes[id]
      if (!existingNote || (importNote.modified ?? -Infinity) > existingNote.modified) {
        res.push(newNote)
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

// selectors
export const selectFilteredNotes = createSelector(
  [
    (s: RootState) => s.notes.notes,
    (s: RootState) => s.notes.query,
    (s: RootState) => s.notes.sort,
  ],
  (notes, query, {prop, desc}) =>
    Object.values(notes)
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
