import {and, eq, gt, inArray, notInArray} from 'drizzle-orm'
import {db} from '../db'
import {notesTbl, usersTbl} from '../db/schema'
import {authEndpointsFactory} from '../endpointsFactory'
import {z} from 'zod'
import createHttpError from 'http-errors'
import {bisectBy} from '../util/misc'
import {Overwrite} from '../util/type'

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
const putsSchema = z.array(putSchema)
type Put = z.infer<typeof putSchema>

type IndeterminatePut = Overwrite<
  Put,
  {
    cipher_text: string | null
    iv: string | null
    deleted_at: number | null
  }
>

export const syncNotesEndpoint = authEndpointsFactory.build({
  method: 'post',
  input: z.object({
    last_synced_to: z.number().int().nonnegative(),
    puts: putsSchema,
    sync_token: z.string().base64().length(24),
  }),
  output: z.object({
    puts: putsSchema,
    conflicts: putsSchema,
    synced_to: z.number().int().positive(),
  }),
  handler: async ({input: {last_synced_to, puts: clientPuts, sync_token}, options: {user}}) => {
    if (!user.sync_token) {
      await db.update(usersTbl).set({sync_token}).where(eq(usersTbl.id, user.id))
    } else if (sync_token !== user.sync_token) {
      throw createHttpError(400, 'Invalid sync token')
    }

    return await db.transaction(async (tx) => {
      const conflicts: IndeterminatePut[] = []
      const nonConflicts: Put[] = []

      const dbNotes = await tx
        .select()
        .from(notesTbl)
        .where(
          and(
            eq(notesTbl.user_id, user.id),
            inArray(
              notesTbl.clientside_id,
              clientPuts.map((n) => n.id)
            )
          )
        )

      const existingMap = new Map(dbNotes.map((n) => [n.clientside_id, n]))

      for (const put of clientPuts) {
        const existing = existingMap.get(put.id)
        if (!existing || put.version > existing.version) {
          nonConflicts.push(put)
        } else {
          conflicts.push({
            id: existing.clientside_id,
            created_at: existing.clientside_created_at,
            updated_at: existing.clientside_updated_at,
            cipher_text: existing.cipher_text,
            iv: existing.iv,
            version: existing.version,
            deleted_at: existing.clientside_deleted_at,
          })
        }
      }

      const [updates, inserts] = bisectBy(nonConflicts, (p) => existingMap.has(p.id))
      const values = inserts.filter((c) => c.cipher_text !== null && c.iv !== null)
      if (values.length > 0) {
        await tx.insert(notesTbl).values(
          values.map((c): typeof notesTbl.$inferInsert => ({
            user_id: user.id,
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
            version: u.version,
          })
          .where(and(eq(notesTbl.user_id, user.id), eq(notesTbl.clientside_id, u.id)))
      }
      const dbPuts = await tx
        .select()
        .from(notesTbl)
        .where(
          and(
            eq(notesTbl.user_id, user.id),
            gt(notesTbl.serverside_updated_at, last_synced_to),
            notInArray(
              notesTbl.clientside_id,
              conflicts.map((c) => c.id)
            )
          )
        )
      const pullPuts = dbPuts.map(
        (n): IndeterminatePut => ({
          id: n.clientside_id,
          created_at: n.clientside_created_at,
          updated_at: n.clientside_updated_at,
          cipher_text: n.cipher_text,
          iv: n.iv,
          version: n.version,
          deleted_at: n.clientside_deleted_at,
        })
      )
      const maxPutAt = Math.max(...dbPuts.map((c) => c.serverside_created_at))

      return {
        puts: putsSchema.parse(pullPuts),
        synced_to: Math.max(last_synced_to, maxPutAt),
        conflicts: putsSchema.parse(conflicts),
      }
    })
  },
})
