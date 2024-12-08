import {XOR} from '../util/type'

export type Note = XOR<DeletedNote, NotDeletedNote>
export type DeletedNote = {
  id: string
  deleted_at: number
}
export type NotDeletedNote = {
  id: string
  txt: string
  created_at: number
  updated_at: number
}

export const isNotDeletedNote = (note: Note): note is NotDeletedNote =>
  note.deleted_at === undefined

export const noteSortProps = ['created_at', 'updated_at', 'txt'] satisfies (keyof Note)[]
export const noteSortOptions = noteSortProps.map((prop) => ({
  value: prop,
  label: prop === 'txt' ? 'Text' : prop === 'created_at' ? 'Created' : 'Modified',
}))

export type NoteSortProp = (typeof noteSortProps)[number]
