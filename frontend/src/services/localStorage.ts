import {NotesState} from '../state/notes'
import {SettingsState} from '../state/settings'
import {UserState} from '../state/user'

export const storeUser = (user: UserState['user']): Promise<void> =>
  Promise.resolve().then(() => {
    localStorage.setItem('user', JSON.stringify(user))
  })

export const loadUser = (): Promise<UserState['user'] | null> =>
  Promise.resolve().then(() => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  })

export const storeOpenNote = (note: NotesState['openNote']): Promise<void> =>
  Promise.resolve().then(() => {
    localStorage.setItem('openNote', JSON.stringify(note))
  })

export const storeOpenNoteSync = (note: NotesState['openNote']): void =>
  localStorage.setItem('openNote', JSON.stringify(note))

export const loadOpenNote = (): Promise<NotesState['openNote']> =>
  Promise.resolve().then(() => {
    const openNoteStr = localStorage.getItem('openNote')
    return openNoteStr ? JSON.parse(openNoteStr) : null
  })

export const storeSettings = (settings: SettingsState['settings']): Promise<void> =>
  Promise.resolve().then(() => {
    localStorage.setItem('settings', JSON.stringify(settings))
  })

export const loadSettings = (): Promise<Partial<SettingsState['settings']> | null> =>
  Promise.resolve().then(() => {
    const settingsStr = localStorage.getItem('settings')
    return settingsStr ? JSON.parse(settingsStr) : null
  })
