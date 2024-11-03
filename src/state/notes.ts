import {createSelector} from 'reselect'
import {generateId} from '../business/generateId'
import {Note, NoteSortProp} from '../business/models'
import {getState, RootState, setState, subscribe} from './store'
import {loadNotes, storeNotes} from '../services/notesStorage'
import {showMessage} from './messages'
import {byProp, debounce, downloadJson, indexBy} from '../util/misc'

export type NotesState = {
  query: string
  notes: {[id: string]: Note}
  openNote: string | null
  sort: {prop: NoteSortProp; desc: boolean}
}

export const notesInit: NotesState = {
  query: '',
  notes: {},
  openNote: null,
  sort: {prop: 'created', desc: true},
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

// effects
export const exportNotes = () => {
  const notes = Object.values(getState().notes.notes)
  downloadJson(notes, 'notes.json')
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
