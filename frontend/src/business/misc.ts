import {threeWayMerge, threeWayMergeArrays} from '../util/merge'
import {deepEquals} from '../util/misc'
import {zodParseString} from '../util/zod'
import {
  Note,
  TextPutTxt,
  textPutTxtSchema,
  Todo,
  TodoPutTxt,
  todoPutTxtSchema,
  Todos,
} from './models'
import {Put} from './notesEncryption'

export const textToTodos = (text: string): Todos => {
  const todos = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({txt: line, done: false, id: crypto.randomUUID(), updated_at: Date.now()}))
  return todos.length === 0
    ? [{txt: '', done: false, id: crypto.randomUUID(), updated_at: Date.now()}]
    : todos
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

export const notesIsEmpty = (note: Note): boolean =>
  note.deleted_at === 0 &&
  note.title === '' &&
  (note.type === 'note'
    ? note.txt === ''
    : note.todos.length === 0 || (note.todos.length === 1 && note.todos[0]!.txt === ''))

export const mergeConflicts = (
  baseVersions: Note[],
  dirtyNotes: Note[],
  serverConflicts: Note[]
): {merged: Note[]; conflicts: Note[]} => {
  const merged: Note[] = []
  const conflicts: Note[] = []
  for (const serverConflict of serverConflicts) {
    const baseVersion = baseVersions.find((n) => n.id === serverConflict.id)
    const dirtyNote = dirtyNotes.find((n) => n.id === serverConflict.id)
    if (
      !baseVersion ||
      !dirtyNote ||
      dirtyNote.type !== serverConflict.type ||
      dirtyNote.deleted_at !== 0 ||
      serverConflict.deleted_at !== 0
    ) {
      conflicts.push(serverConflict)
    } else {
      const merge = mergeConflict(baseVersion, dirtyNote, serverConflict)
      if (merge) {
        merged.push(merge)
      } else {
        conflicts.push(serverConflict)
      }
    }
  }
  return {merged, conflicts}
}

export const mergeConflict = (
  baseVersion: Note,
  dirtyNote: Note,
  serverConflict: Note
): Note | null => {
  if (dirtyNote.type === 'todo') {
    return mergeTodoConflict(baseVersion, dirtyNote, serverConflict)
  } else if (dirtyNote.type === 'note') {
    return mergeNoteConflict(baseVersion, dirtyNote, serverConflict)
  } else {
    return null
  }
}

export const todoHasIdAndUpdatedAt = (todo: Todo): boolean =>
  todo.id !== undefined && todo.updated_at !== undefined
export const todosHaveIdsAndUpdatedAt = (todos: Todos): boolean =>
  todos.every(todoHasIdAndUpdatedAt)

export const mergeTodoConflict = (
  baseVersion: Note,
  dirtyNote: Note,
  serverConflict: Note
): Note | null => {
  if (
    dirtyNote.todos === undefined ||
    serverConflict.todos === undefined ||
    !todosHaveIdsAndUpdatedAt(dirtyNote.todos) ||
    !todosHaveIdsAndUpdatedAt(serverConflict.todos)
  ) {
    return null
  }
  let todos: Todos
  if (deepEquals(dirtyNote.todos, serverConflict.todos, ['id', 'updated_at'])) {
    todos = dirtyNote.todos
  } else if (baseVersion.todos === undefined || !todosHaveIdsAndUpdatedAt(baseVersion.todos)) {
    return null
  } else {
    const baseIds = baseVersion.todos.map((t) => t.id!)
    const dirtyIds = dirtyNote.todos.map((t) => t.id!)
    const serverIds = serverConflict.todos.map((t) => t.id!)
    const mergedIds = threeWayMergeArrays(baseIds, dirtyIds, serverIds)
    todos = mergedIds.map((id) => {
      const dirtyTodo = dirtyNote.todos.find((t) => t.id === id)
      const serverTodo = serverConflict.todos.find((t) => t.id === id)
      if (!dirtyTodo && serverTodo) {
        return serverTodo
      } else if (!serverTodo && dirtyTodo) {
        return dirtyTodo
      } else if (dirtyTodo && serverTodo) {
        return dirtyTodo.updated_at! > serverTodo.updated_at! ? dirtyTodo : serverTodo
      } else {
        throw new Error('threeWayMergeArrays failed')
      }
    })
  }
  return {
    type: 'todo',
    id: baseVersion.id,
    created_at: baseVersion.created_at,
    updated_at: Date.now(),
    deleted_at: 0,
    version: Math.max(dirtyNote.version, serverConflict.version) + 1,
    state: 'dirty',
    title:
      dirtyNote.updated_at > serverConflict.updated_at ? dirtyNote.title : serverConflict.title,
    todos,
  }
}

export const mergeNoteConflict = (
  baseVersion: Note,
  dirtyNote: Note,
  serverConflict: Note
): Note | null => {
  if (dirtyNote.txt === undefined || serverConflict.txt === undefined) {
    return null
  }
  let txt: string
  if (dirtyNote.txt === serverConflict.txt) {
    txt = dirtyNote.txt
  } else if (baseVersion.txt === undefined) {
    return null
  } else {
    txt = threeWayMerge(baseVersion.txt, dirtyNote.txt, serverConflict.txt)
  }
  return {
    type: 'note',
    id: baseVersion.id,
    created_at: baseVersion.created_at,
    updated_at: Date.now(),
    txt,
    title:
      dirtyNote.updated_at > serverConflict.updated_at ? dirtyNote.title : serverConflict.title,
    version: Math.max(dirtyNote.version, serverConflict.version) + 1,
    state: 'dirty',
    deleted_at: 0,
  }
}
