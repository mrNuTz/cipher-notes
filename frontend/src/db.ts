import Dexie, {EntityTable, liveQuery} from 'dexie'
import {Note} from './business/models'

export const db = new Dexie('DexieDB') as Dexie & {
  notes: EntityTable<Note, 'id'>
}

db.version(1).stores({
  notes: 'id, txt, created_at, updated_at, version, state, deleted_at',
})

db.version(2)
  .stores({
    notes: 'id, created_at, updated_at, version, state, deleted_at, type',
  })
  .upgrade((tx) =>
    tx
      .table('notes')
      .toCollection()
      .modify((note) => {
        note.type = 'note'
      })
  )

db.version(3)
  .stores({
    notes: 'id, created_at, updated_at, version, state, deleted_at, type',
  })
  .upgrade((tx) =>
    tx
      .table('notes')
      .toCollection()
      .modify((note) => {
        note.title = ''
      })
  )

/*
db.version(4)
  .stores({
    notes_base_version: 'id',
  })
  .upgrade(async (tx) => {
    const notes = await tx.table('notes').where('state').equals('synched').toArray()
    await tx.table('notes_base_version').bulkAdd(notes)
  })
*/

export const dirtyNotesObservable = liveQuery(() =>
  db.notes.where('state').equals('dirty').toArray()
)
