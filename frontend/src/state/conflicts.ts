import {Put} from '../business/notesEncryption'
import {db} from '../db'
import {getState, setState} from './store'
import {Note} from '../business/models'
import {putToNote} from '../business/misc'

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

  const note: Note = putToNote(serverPut)
  await db.notes.put(note)

  setState((s) => {
    s.conflicts.conflicts = s.conflicts.conflicts.slice(1)
  })
}
