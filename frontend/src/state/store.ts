import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {searchInit, SearchState} from './search'
import {notesInit, NotesState, registerNotesSubscriptions} from './notes'
import {messagesInit, MessagesState} from './messages'
import {subscribeWithSelector} from 'zustand/middleware'

type MainTab = 'search' | 'notes'
export type RootState = {
  activeTab: MainTab
  search: SearchState
  notes: NotesState
  messages: MessagesState
}
const init: RootState = {
  activeTab: 'notes',
  search: searchInit,
  notes: notesInit,
  messages: messagesInit,
}
export const useSelector = create<RootState>()(immer(subscribeWithSelector(() => init)))
export const getState = useSelector.getState
export const setState = useSelector.setState
export const subscribe = useSelector.subscribe

export const tabChanged = (tab: string | null) => {
  if (tab === 'search' || tab === 'notes') {
    setState((state) => {
      state.activeTab = tab
    })
  }
}

registerNotesSubscriptions()
