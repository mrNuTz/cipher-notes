import {and, eq, gt, inArray} from 'drizzle-orm'
import {db} from '../db'
import {notesTbl, usersTbl} from '../db/schema'
import {authEndpointsFactory} from '../endpointsFactory'
import {z} from 'zod'
import createHttpError from 'http-errors'
import {bisectBy} from '../util/misc'

const upsertSchema = z.object({
  id: z.string().uuid(),
  created_at: z.number().int().positive(),
  updated_at: z.number().int().positive(),
  cipher_text: z.string(),
  iv: z.string(),
  version: z.number().int().positive(),
  deleted_at: z.null(),
})
const deleteSchema = z.object({
  id: z.string().uuid(),
  created_at: z.number().int().positive(),
  updated_at: z.number().int().positive(),
  cipher_text: z.null(),
  iv: z.null(),
  version: z.number().int().positive(),
  deleted_at: z.number().int().positive(),
})
const putSchema = z.union([upsertSchema, deleteSchema])
type Put = z.infer<typeof putSchema>

export const syncNotesEndpoint = authEndpointsFactory.build({
  method: 'post',
  input: z.object({
    last_synced_to: z.number().int().nonnegative(),
    puts: z.array(putSchema),
    sync_token: z.string().base64().length(24),
  }),
  output: z.object({
    puts: z.array(putSchema),
    synced_to: z.number().int().positive(),
  }),
  handler: async ({input: {last_synced_to, puts, sync_token}, options: {user}}) => {
    if (!user.sync_token) {
      await db.update(usersTbl).set({sync_token}).where(eq(usersTbl.id, user.id))
    } else if (sync_token !== user.sync_token) {
      throw createHttpError(400, 'Invalid sync token')
    }
    await pushNotes(puts, user.id)
    return await getPullData(last_synced_to, user.id)
  },
})

export const pushNotes = (puts: Put[], userId: number) =>
  db.transaction(async (tx) => {
    const dbNotes = await tx
      .select()
      .from(notesTbl)
      .where(
        and(
          eq(notesTbl.user_id, userId),
          inArray(
            notesTbl.clientside_id,
            puts.map((n) => n.id)
          )
        )
      )
    const existingMap = new Map(dbNotes.map((n) => [n.clientside_id, n]))
    const [updates, inserts] = bisectBy(puts, (p) => existingMap.has(p.id))
    const values = inserts.filter((c) => c.cipher_text !== null && c.iv !== null)
    if (values.length > 0) {
      await tx.insert(notesTbl).values(
        values.map((c): typeof notesTbl.$inferInsert => ({
          user_id: userId,
          clientside_id: c.id,
          cipher_text: c.cipher_text,
          iv: c.iv,
          clientside_created_at: c.created_at,
          clientside_updated_at: c.updated_at,
          version: 1,
        }))
      )
    }
    for (const u of updates) {
      await tx
        .update(notesTbl)
        .set({
          cipher_text: u.cipher_text,
          iv: u.iv,
          clientside_created_at: u.created_at,
          clientside_updated_at: u.updated_at,
          clientside_deleted_at: u.deleted_at,
          version: Math.max(u.version, dbNotes.find((n) => n.clientside_id === u.id)!.version + 1),
        })
        .where(and(eq(notesTbl.user_id, userId), eq(notesTbl.clientside_id, u.id)))
    }
  })

const getPullData = async (
  last_synced_to: number,
  userId: number
): Promise<{puts: Put[]; synced_to: number}> => {
  const dbPuts = await db
    .select()
    .from(notesTbl)
    .where(and(eq(notesTbl.user_id, userId), gt(notesTbl.serverside_updated_at, last_synced_to)))
  const puts = dbPuts
    .map((n) => ({
      id: n.clientside_id,
      created_at: n.clientside_created_at,
      updated_at: n.clientside_updated_at,
      cipher_text: n.cipher_text,
      iv: n.iv,
      version: n.version,
      deleted_at: n.clientside_deleted_at,
    }))
    .filter(
      (
        p
      ): p is typeof p &
        (
          | {deleted_at: null; cipher_text: string; iv: string}
          | {deleted_at: number; cipher_text: null; iv: null}
        ) =>
        (p.deleted_at === null && typeof p.cipher_text === 'string' && typeof p.iv === 'string') ||
        (typeof p.deleted_at === 'number' && p.cipher_text === null && p.iv === null)
    )
  const maxPutAt = Math.max(...dbPuts.map((c) => c.serverside_created_at))

  return {
    puts,
    synced_to: Math.max(last_synced_to, maxPutAt),
  }
}
