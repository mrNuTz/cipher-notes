import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {notesInit, NotesState, registerNotesSubscriptions} from './notes'
import {messagesInit, MessagesState} from './messages'
import {subscribeWithSelector} from 'zustand/middleware'
import {registerUserSubscriptions, userInit, UserState} from './user'

export type RootState = {
  notes: NotesState
  messages: MessagesState
  user: UserState
}
const init: RootState = {
  notes: notesInit,
  messages: messagesInit,
  user: userInit,
}
export const useSelector = create<RootState>()(immer(subscribeWithSelector(() => init)))
export const getState = useSelector.getState
export const setState = useSelector.setState
export const subscribe = useSelector.subscribe

registerNotesSubscriptions()
registerUserSubscriptions()
