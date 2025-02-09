import {zodParseString} from '../util/zod'
import {Note, TextPutTxt, textPutTxtSchema, TodoPutTxt, todoPutTxtSchema, Todos} from './models'
import {Put} from './notesEncryption'

export const textToTodos = (text: string): Todos => {
  const todos = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({txt: line, done: false}))
  return todos.length === 0 ? [{txt: '', done: false}] : todos
}

export const todosToText = (todos: Todos): string => todos.map((t) => t.txt).join('\n')

export const putToNote = (put: Put): Note => {
  const {id, created_at, updated_at, version, deleted_at, type, txt} = put
  if (txt === null && type === 'note') {
    return {
      type: 'note',
      id,
      created_at,
      updated_at,
      version,
      deleted_at,
      state: 'synced',
      title: '',
      txt: '',
    }
  } else if (txt === null && type === 'todo') {
    return {
      type: 'todo',
      id,
      created_at,
      updated_at,
      version,
      deleted_at,
      state: 'synced',
      title: '',
      todos: [],
    }
  } else if (typeof txt === 'string' && type === 'note') {
    const {title, txt} = zodParseString(textPutTxtSchema, put.txt) ?? {title: '', txt: put.txt}
    return {
      type: 'note',
      id: put.id,
      created_at: put.created_at,
      updated_at: put.updated_at,
      txt,
      title,
      version: put.version,
      state: 'synced',
      deleted_at: put.deleted_at ?? 0,
    }
  } else if (typeof txt === 'string' && type === 'todo') {
    const {title, todos} = zodParseString(todoPutTxtSchema, put.txt) ?? {
      title: '',
      todos: put.txt ? [{done: false, txt: put.txt}] : [],
    }
    return {
      type: 'todo',
      id: put.id,
      created_at: put.created_at,
      updated_at: put.updated_at,
      todos,
      title,
      version: put.version,
      state: 'synced',
      deleted_at: put.deleted_at ?? 0,
    }
  } else {
    throw new Error('Invalid put')
  }
}

export const noteToPut = (n: Note): Put => {
  if (n.deleted_at !== 0) {
    return {
      id: n.id,
      created_at: n.created_at,
      txt: null,
      updated_at: n.updated_at,
      version: n.version,
      deleted_at: n.deleted_at,
      type: n.type,
    }
  } else if (n.type === 'todo') {
    const txtObj: TodoPutTxt = {title: n.title, todos: n.todos}
    return {
      id: n.id,
      created_at: n.created_at,
      txt: JSON.stringify(txtObj),
      updated_at: n.updated_at,
      version: n.version,
      deleted_at: null,
      type: n.type,
    }
  } else if (n.type === 'note') {
    const txtObj: TextPutTxt = {title: n.title, txt: n.txt}
    return {
      id: n.id,
      created_at: n.created_at,
      txt: JSON.stringify(txtObj),
      updated_at: n.updated_at,
      version: n.version,
      deleted_at: null,
      type: n.type,
    }
  } else {
    throw new Error('Invalid note')
  }
}
