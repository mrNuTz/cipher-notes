import {zodParseString} from '../util/zod'
import {Note, Todos, todosSchema} from './models'
import {Put} from './notesEncryption'

export const textToTodos = (text: string): Todos =>
  text.split('\n').map((line) => ({txt: line, done: false}))
export const todosToText = (todos: Todos): string => todos.map((t) => t.txt).join('\n')

export const putToNote = (put: Put): Note =>
  put.type === 'note'
    ? {
        type: 'note',
        id: put.id,
        created_at: put.created_at,
        updated_at: put.updated_at,
        txt: put.txt ?? '',
        version: put.version,
        state: 'synced',
        deleted_at: put.deleted_at ?? 0,
      }
    : {
        type: 'todo',
        id: put.id,
        created_at: put.created_at,
        updated_at: put.updated_at,
        todos: put.txt ? zodParseString(todosSchema, put.txt) ?? [{done: false, txt: put.txt}] : [],
        version: put.version,
        state: 'synced',
        deleted_at: put.deleted_at ?? 0,
      }
