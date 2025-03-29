import {z} from 'zod'
import {XOR} from '../util/type'

export type NoteCommon = {
  id: string
  title: string
  created_at: number
  updated_at: number
  version: number
  state: 'dirty' | 'synced'
  deleted_at: number
}
export type TextNote = NoteCommon & {type: 'note'; txt: string}
export type TodoNote = NoteCommon & {type: 'todo'; todos: Todos}

export type Note = XOR<TextNote, TodoNote>

export const noteSortProps = ['created_at', 'updated_at'] satisfies (keyof Note)[]
export const noteSortOptions = noteSortProps.map((prop) => ({
  value: prop,
  label: prop === 'created_at' ? 'Created' : 'Modified',
}))

export type NoteSortProp = (typeof noteSortProps)[number]

export const todoSchema = z.object({
  done: z.boolean(),
  txt: z.string(),
})
export type Todo = z.infer<typeof todoSchema>
export const todosSchema = z.array(todoSchema)
export type Todos = z.infer<typeof todosSchema>

export type TextOpenNote = {
  type: 'note'
  id: string
  title: string
  txt: string
  updatedAt: number
}
export type TodoOpenNote = {
  type: 'todo'
  id: string
  title: string
  todos: {
    done: boolean
    txt: string
  }[]
  updatedAt: number
}
export type OpenNote = XOR<TextOpenNote, TodoOpenNote>

export type NoteHistoryItem = {type: 'note'; txt: string} | {type: 'todo'; todos: Todos}

export const textPutTxtSchema = z.object({
  title: z.string(),
  txt: z.string(),
})
export type TextPutTxt = z.infer<typeof textPutTxtSchema>

export const todoPutTxtSchema = z.object({
  title: z.string(),
  todos: todosSchema,
})
export type TodoPutTxt = z.infer<typeof todoPutTxtSchema>
