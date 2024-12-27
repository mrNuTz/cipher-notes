import {and, eq, gt, inArray, isNotNull} from 'drizzle-orm'
import {db} from '../db'
import {notesTbl, usersTbl} from '../db/schema'
import {authEndpointsFactory} from '../endpointsFactory'
import {z} from 'zod'
import createHttpError from 'http-errors'

const putSchema = z.object({
  id: z.string().uuid(),
  created_at: z.number().int().positive(),
  updated_at: z.number().int().positive(),
  cipher_text: z.string(),
  iv: z.string(),
  version: z.number().int().positive(),
})
type Put = z.infer<typeof putSchema>
const deleteSchema = z.object({
  id: z.string().uuid(),
  deleted_at: z.number().int().positive(),
})
type Delete = z.infer<typeof deleteSchema>

export const syncNotesEndpoint = authEndpointsFactory.build({
  method: 'post',
  input: z.object({
    last_synced_to: z.number().int().nonnegative(),
    puts: z.array(putSchema),
    deletes: z.array(deleteSchema),
    sync_token: z.string().base64().length(24),
  }),
  output: z.object({
    puts: z.array(putSchema),
    deletes: z.array(deleteSchema),
    synced_to: z.number().int().positive(),
  }),
  handler: async ({input: {last_synced_to, puts, deletes, sync_token}, options: {user}}) => {
    if (!user.sync_token) {
      await db.update(usersTbl).set({sync_token}).where(eq(usersTbl.id, user.id))
    } else if (sync_token !== user.sync_token) {
      throw createHttpError(400, 'Invalid sync token')
    }
    await pushNotes(puts, deletes, user.id)
    return await getPullData(last_synced_to, user.id)
  },
})

const getPullData = async (last_synced_to: number, userId: number) => {
  // puts
  const dbPuts = await db
    .select()
    .from(notesTbl)
    .where(
      and(
        eq(notesTbl.user_id, userId),
        gt(notesTbl.serverside_updated_at, last_synced_to),
        isNotNull(notesTbl.cipher_text),
        isNotNull(notesTbl.iv)
      )
    )
  const puts: Put[] = dbPuts.map((n) => ({
    id: n.clientside_id,
    created_at: n.clientside_created_at,
    updated_at: n.clientside_updated_at,
    cipher_text: n.cipher_text!,
    iv: n.iv!,
    version: n.version,
  }))
  const maxPutAt = Math.max(...dbPuts.map((c) => c.serverside_created_at))

  // deletes
  const dbDeletes = await db
    .select()
    .from(notesTbl)
    .where(and(eq(notesTbl.user_id, userId), gt(notesTbl.serverside_deleted_at, last_synced_to)))
  const deletes: Delete[] = dbDeletes.map((d) => ({
    id: d.clientside_id,
    deleted_at: d.clientside_deleted_at!,
  }))
  const maxDeletedAt = Math.max(...dbDeletes.map((d) => d.serverside_deleted_at ?? 0))

  return {
    puts,
    deletes,
    synced_to: Math.max(last_synced_to, maxPutAt, maxDeletedAt),
  }
}

export const pushNotes = (puts: Put[], deletes: Delete[], userId: number) =>
  db.transaction(async (tx) => {
    // puts
    const putIds = puts.map((n) => n.id)
    const existingNotes = await tx
      .select()
      .from(notesTbl)
      .where(and(eq(notesTbl.user_id, userId), inArray(notesTbl.clientside_id, putIds)))
    const existingIds = existingNotes.map((n) => n.clientside_id)
    const creates = puts.filter((n) => !existingIds.includes(n.id))
    if (creates.length > 0) {
      await tx.insert(notesTbl).values(
        creates.map((n) => ({
          user_id: userId,
          clientside_id: n.id,
          cipher_text: n.cipher_text,
          iv: n.iv,
          clientside_created_at: n.created_at,
          clientside_updated_at: n.updated_at,
          version: 1,
        }))
      )
    }
    const updates = puts.filter((n) => existingIds.includes(n.id))
    for (const update of updates) {
      await tx
        .update(notesTbl)
        .set({
          cipher_text: update.cipher_text,
          iv: update.iv,
          clientside_created_at: update.created_at,
          clientside_updated_at: update.updated_at,
          version: Math.max(
            update.version,
            existingNotes.find((n) => n.clientside_id === update.id)!.version + 1
          ),
        })
        .where(and(eq(notesTbl.user_id, userId), eq(notesTbl.clientside_id, update.id)))
    }

    // deletes
    const now = Date.now()
    for (const d of deletes) {
      await tx
        .update(notesTbl)
        .set({
          clientside_deleted_at: d.deleted_at,
          iv: null,
          cipher_text: null,
          serverside_deleted_at: now,
        })
        .where(and(eq(notesTbl.user_id, userId), eq(notesTbl.clientside_id, d.id)))
    }
  })
