import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {notesInit, NotesState, registerNotesSubscriptions} from './notes'
import {messagesInit, MessagesState} from './messages'
import {subscribeWithSelector} from 'zustand/middleware'
import {registerUserSubscriptions, userInit, UserState} from './user'
import {conflictsInit, ConflictsState} from './conflicts'

export type RootState = {
  notes: NotesState
  messages: MessagesState
  user: UserState
  conflicts: ConflictsState
}
const init: RootState = {
  notes: notesInit,
  messages: messagesInit,
  user: userInit,
  conflicts: conflictsInit,
}
export const useSelector = create<RootState>()(immer(subscribeWithSelector(() => init)))
export const getState = useSelector.getState
export const setState = useSelector.setState
export const subscribe = useSelector.subscribe

registerUserSubscriptions()
registerNotesSubscriptions()

export const selectAnyDialogOpen = (s: RootState): boolean =>
  s.conflicts.conflicts.length > 0 ||
  s.messages.messages.length > 0 ||
  s.notes.openNote !== null ||
  s.notes.importDialog.open ||
  s.user.syncDialog.open ||
  s.user.registerDialog.open ||
  s.user.loginDialog.open ||
  s.user.encryptionKeyDialog.open ||
  s.user.impressumOpen
