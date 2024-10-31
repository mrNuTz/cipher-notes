import {createSelector} from 'reselect'
import {generateId} from '../business/generateId'
import {Note} from '../business/models'
import {getState, RootState, setState} from './store'
import {loadNotes, storeNotes} from '../services/notesStorage'
import {showMessage} from './messages'
import {indexBy} from '../util/misc'

export type NotesState = {
  query: string
  notes: {[id: string]: Note}
  openNote: string | null
}

export const notesInit: NotesState = {
  query: '',
  notes: {},
  openNote: null,
}

loadNotes().then((notes) =>
  setState((s) => {
    s.notes.notes = indexBy(notes, (n) => n.id)
  })
)

export const noteQueryChanged = (query: string) =>
  setState((s) => {
    s.notes.query = query
  })
export const openNote = (id: string) =>
  setState((s) => {
    s.notes.openNote = id
  })
export const closeNote = () => {
  setState((s) => {
    s.notes.openNote = null
  })
  storeNotes(Object.values(getState().notes.notes)).catch(() =>
    showMessage({title: 'Error', text: 'Failed to save notes'})
  )
}
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

export const selectFilteredNotes = createSelector(
  [(s: RootState) => s.notes.notes, (s: RootState) => s.notes.query],
  (notes, query) => Object.values(notes).filter((n) => !query || n.txt.includes(query))
)
export const selectOpenNote = createSelector(
  [(s: RootState) => s.notes.notes, (s: RootState) => s.notes.openNote],
  (notes, id): Note | undefined => (id ? notes[id] : undefined)
)
