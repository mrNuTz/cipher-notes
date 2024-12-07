export type Note = {
  id: string
  txt: string
  created_at: number
  updated_at: number
}

export const noteSortProps = ['created_at', 'updated_at', 'txt'] satisfies (keyof Note)[]
export const noteSortOptions = noteSortProps.map((prop) => ({
  value: prop,
  label: prop === 'txt' ? 'Text' : prop === 'created_at' ? 'Created' : 'Modified',
}))

export type NoteSortProp = (typeof noteSortProps)[number]
