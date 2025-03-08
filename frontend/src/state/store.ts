import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'
import {notesInit, NotesState, registerNotesSubscriptions} from './notes'
import {messagesInit, MessagesState} from './messages'
import {subscribeWithSelector} from 'zustand/middleware'
import {registerUserSubscriptions, userInit, UserState} from './user'
import {conflictsInit, ConflictsState} from './conflicts'
import {registerSettingsSubscriptions, settingsInit, SettingsState} from './settings'

export type RootState = {
  notes: NotesState
  messages: MessagesState
  user: UserState
  conflicts: ConflictsState
  settings: SettingsState
}
const init: RootState = {
  notes: notesInit,
  messages: messagesInit,
  user: userInit,
  conflicts: conflictsInit,
  settings: settingsInit,
}
export const useSelector = create<RootState>()(immer(subscribeWithSelector(() => init)))
export const getState = useSelector.getState
export const setState = useSelector.setState
export const subscribe = useSelector.subscribe

registerUserSubscriptions()
registerNotesSubscriptions()
registerSettingsSubscriptions()

export const selectAnyDialogOpen = (s: RootState): boolean =>
  s.conflicts.conflicts.length > 0 ||
  s.messages.messages.length > 0 ||
  s.notes.openNote !== null ||
  s.notes.importDialog.open ||
  s.notes.sync.dialogOpen ||
  s.user.registerDialog.open ||
  s.user.loginDialog.open ||
  s.user.encryptionKeyDialog.open ||
  s.user.impressumOpen ||
  s.settings.open
