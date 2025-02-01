import {Put} from '../business/notesEncryption'
import {db} from '../db'
import {getState, setState} from './store'
import {Note, todosSchema} from '../business/models'
import {zodParseString} from '../util/zod'

export type ConflictsState = {
  conflicts: Put[]
}

export const conflictsInit: ConflictsState = {
  conflicts: [],
}

export const pickLocalNote = async () => {
  const state = getState()
  const conflicts = state.conflicts.conflicts
  const serverPut = conflicts[0]
  if (!serverPut) return
  const localNote = await db.notes.get(serverPut.id)
  if (!localNote) return
  const updatedNote: Note = {
    ...localNote,
    version: Math.max(localNote.version, serverPut.version) + 1,
    state: 'dirty',
  }
  await db.notes.put(updatedNote)
  setState((s) => {
    s.conflicts.conflicts = s.conflicts.conflicts.slice(1)
  })
}

export const pickServerNote = async () => {
  const state = getState()
  const conflicts = state.conflicts.conflicts
  const serverPut = conflicts[0]
  if (!serverPut) return

  const note: Note =
    serverPut.type === 'note'
      ? {
          id: serverPut.id,
          type: 'note',
          txt: serverPut.txt ?? '',
          created_at: serverPut.created_at,
          updated_at: serverPut.updated_at,
          deleted_at: serverPut.deleted_at ?? 0,
          version: serverPut.version,
          state: 'synced',
        }
      : {
          id: serverPut.id,
          type: 'todo',
          todos: serverPut.txt ? zodParseString(todosSchema, serverPut.txt) ?? [] : [],
          created_at: serverPut.created_at,
          updated_at: serverPut.updated_at,
          deleted_at: serverPut.deleted_at ?? 0,
          version: serverPut.version,
          state: 'synced',
        }
  await db.notes.put(note)

  setState((s) => {
    s.conflicts.conflicts = s.conflicts.conflicts.slice(1)
  })
}
