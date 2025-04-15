import Dexie, {EntityTable, liveQuery} from 'dexie'
import {Label, Note} from './business/models'

export const db = new Dexie('DexieDB') as Dexie & {
  notes: EntityTable<Note, 'id'>
  note_base_versions: EntityTable<Note, 'id'>
  labels: EntityTable<Label, 'id'>
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

db.version(4)
  .stores({
    note_base_versions: 'id',
  })
  .upgrade(async (tx) => {
    const notes = await tx.table('notes').where('state').equals('synced').toArray()
    await tx.table('note_base_versions').bulkAdd(notes)
  })

db.version(5).stores({
  labels: 'id, deleted_at, state',
})

export const dirtyNotesObservable = liveQuery(() =>
  db.notes.where('state').equals('dirty').toArray()
)

export const labelsObservable = liveQuery(() => db.labels.toArray())
