import {db} from '../db'
import {notesTbl, sessionsTbl} from '../db/schema'
import {lt} from 'drizzle-orm'
import {env} from '../env'

export const cleanupDb = async () => {
  const cutoffSessions = Date.now() - 1000 * 60 * Number(env.SESSION_TTL_MIN)
  await db.delete(sessionsTbl).where(lt(sessionsTbl.created_at, cutoffSessions))

  const cutoffDeletedNotes = Date.now() - 1000 * 60 * 60 * 24 * 30 * 3
  await db.delete(notesTbl).where(lt(notesTbl.serverside_deleted_at, cutoffDeletedNotes))

  console.log('Cleaned up DB')
}
