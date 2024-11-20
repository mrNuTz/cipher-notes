import {createSelector} from 'reselect'
import {defaultEngines, Engine} from '../business/defaultEngines'
import {RootState, setState} from './store'
import {compare} from '../util/misc'

export type SearchState = {
  query: string
  engines: Engine[]
  selectedEngine: string | null
  defaultEngine: string
}

export const searchInit: SearchState = {
  query: '',
  engines: [...defaultEngines],
  selectedEngine: null,
  defaultEngine: '',
}

// actions
export const queryChanged = (query: string) =>
  setState((state) => {
    state.search.query = query
  })
export const engineSelected = (engine: string | null) =>
  setState((s) => {
    s.search.selectedEngine = engine
  })

// selectors
export const selectEngineOptions = createSelector(
  (s: RootState) => s.search.engines,
  (engines) => engines.map((e) => e.name).sort(compare)
)
export const selectSelectedEngine = createSelector(
  [(s: RootState) => s.search.engines, (s: RootState) => s.search.selectedEngine],
  (engines, sel): Engine | null => engines.find((e) => e.name === sel) ?? null
)
export const selectSelectedUrl = (s: RootState): string => selectSelectedEngine(s)?.url ?? ''
export const selectCurrentUrl = createSelector(
  [(s: RootState) => s.search.query, selectSelectedUrl],
  (q, url): string => url.replace('%s', encodeURIComponent(q.trim()))
)
