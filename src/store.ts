import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {defaultEngines, Engine} from './defaultEngines'
import {createSelector} from 'reselect'

type State = {
  query: string
  engines: Engine[]
  selectedEngine: string | null
}
const init: State = {
  query: '',
  engines: [...defaultEngines],
  selectedEngine: null,
}
export const useSelector = create<State>()(immer(() => init))
export const getState = useSelector.getState
export const setState = useSelector.setState
export const subscribe = useSelector.subscribe

export const queryChanged = (query: string) =>
  setState((state) => {
    state.query = query
  })
export const engineSelected = (engine: string | null) =>
  setState((s) => {
    s.selectedEngine = engine
  })

export const selectEngineOptions = createSelector(
  (s: State) => s.engines,
  (engines) => engines.map((e) => e.name).sort()
)
export const selectSelectedEngine = createSelector(
  [(s: State) => s.engines, (s: State) => s.selectedEngine],
  (engines, sel): Engine | null => engines.find((e) => e.name === sel) ?? null
)
export const selectSelectedUrl = (s: State): string => selectSelectedEngine(s)?.url ?? ''
export const selectCurrentUrl = createSelector([(s: State) => s.query, selectSelectedUrl], (q, url): string =>
  url.replace('%s', encodeURIComponent(q))
)
