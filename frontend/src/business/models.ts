export type Note = {
  id: string
  txt: string
  created: number
  modified: number
}

export type NoteSortProp = Exclude<keyof Note, 'id'>
