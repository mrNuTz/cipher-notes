import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {defaultEngines, Engine} from './business/defaultEngines'
import {createSelector} from 'reselect'
import {compare} from './util/misc'
import {generateId} from './business/generateId'

type Note = {
  id: string
  txt: string
  created: number
  modified: number
}
type MainTab = 'search' | 'notes'
type State = {
  activeTab: MainTab
  search: {
    query: string
    engines: Engine[]
    selectedEngine: string | null
    defaultEngine: string
  }
  notes: {
    query: string
    notes: {[id: string]: Note}
    openNote: string | null
  }
}
const init: State = {
  activeTab: 'notes',
  search: {
    query: '',
    engines: [...defaultEngines],
    selectedEngine: null,
    defaultEngine: '',
  },
  notes: {
    query: '',
    notes: {},
    openNote: null,
  },
}
export const useSelector = create<State>()(immer(() => init))
export const getState = useSelector.getState
export const setState = useSelector.setState
export const subscribe = useSelector.subscribe

// actions
export const tabChanged = (tab: string | null) => {
  if (tab === 'search' || tab === 'notes') {
    setState((state) => {
      state.activeTab = tab
    })
  }
}
export const queryChanged = (query: string) =>
  setState((state) => {
    state.search.query = query
  })
export const engineSelected = (engine: string | null) =>
  setState((s) => {
    s.search.selectedEngine = engine
  })
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

// selectors
export const selectEngineOptions = createSelector(
  (s: State) => s.search.engines,
  (engines) => engines.map((e) => e.name).sort(compare)
)
export const selectSelectedEngine = createSelector(
  [(s: State) => s.search.engines, (s: State) => s.search.selectedEngine],
  (engines, sel): Engine | null => engines.find((e) => e.name === sel) ?? null
)
export const selectSelectedUrl = (s: State): string => selectSelectedEngine(s)?.url ?? ''
export const selectCurrentUrl = createSelector(
  [(s: State) => s.search.query, selectSelectedUrl],
  (q, url): string => url.replace('%s', encodeURIComponent(q.trim()))
)
export const selectFilteredNotes = createSelector(
  [(s: State) => s.notes.notes, (s: State) => s.notes.query],
  (notes, query) => Object.values(notes).filter((n) => !query || n.txt.includes(query))
)
export const selectOpenNote = createSelector(
  [(s: State) => s.notes.notes, (s: State) => s.notes.openNote],
  (notes, id): Note | undefined => (id ? notes[id] : undefined)
)
