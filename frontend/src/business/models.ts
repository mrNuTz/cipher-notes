import {z} from 'zod'
import {XOR} from '../util/type'

export type NoteCommon = {
  id: string
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

export const textOpenNoteSchema = z.object({
  type: z.literal('note'),
  id: z.string(),
  txt: z.string(),
  todos: z.literal(undefined),
})
export type TextOpenNote = z.infer<typeof textOpenNoteSchema>

export const todoOpenNoteSchema = z.object({
  type: z.literal('todo'),
  id: z.string(),
  todos: todosSchema,
  txt: z.literal(undefined),
})
export type TodoOpenNote = z.infer<typeof todoOpenNoteSchema>

export const openNoteSchema = z.discriminatedUnion('type', [textOpenNoteSchema, todoOpenNoteSchema])
export type OpenNote = z.infer<typeof openNoteSchema>

export const legacyOpenNoteSchema = z.object({
  id: z.string(),
  txt: z.string(),
  type: z.literal(undefined),
})
export type LegacyOpenNote = z.infer<typeof legacyOpenNoteSchema>

export const anyOpenNoteSchema = z.union([openNoteSchema, legacyOpenNoteSchema])
export type AnyOpenNote = z.infer<typeof anyOpenNoteSchema>

export type NoteHistoryItem = {type: 'note'; txt: string} | {type: 'todo'; todos: Todos}
