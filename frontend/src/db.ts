import Dexie, {EntityTable} from 'dexie'
import {Note} from './business/models'

export const db = new Dexie('DexieDB') as Dexie & {
  notes: EntityTable<Note, 'id'>
}

db.version(1).stores({
  notes: 'id, txt, created_at, updated_at, version, state, deleted_at',
})
