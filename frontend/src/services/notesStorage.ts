import {Note} from '../business/models'

export const storeNotes = (notes: Note[]): Promise<void> =>
  Promise.resolve().then(() => {
    localStorage.setItem('notes', JSON.stringify(notes))
  })

export const loadNotes = (): Promise<Note[]> =>
  Promise.resolve().then(() => {
    const notes = localStorage.getItem('notes')
    return notes ? JSON.parse(notes) : []
  })
