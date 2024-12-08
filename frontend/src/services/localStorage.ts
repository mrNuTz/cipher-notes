import {Note} from '../business/models'
import {UserState} from '../state/user'

export const storeNotes = (notes: Note[]): Promise<void> =>
  Promise.resolve().then(() => {
    localStorage.setItem('notes', JSON.stringify(notes))
  })

export const loadNotes = (): Promise<Note[]> =>
  Promise.resolve().then(() => {
    const notes = localStorage.getItem('notes')
    return notes ? JSON.parse(notes) : []
  })

export const storeUser = (user: UserState['user']): Promise<void> =>
  Promise.resolve().then(() => {
    localStorage.setItem('user', JSON.stringify(user))
  })

export const loadUser = (): Promise<UserState['user'] | null> =>
  Promise.resolve().then(() => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  })
