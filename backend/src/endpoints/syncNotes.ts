import {and, eq, gt, inArray, isNotNull, not} from 'drizzle-orm'
import {db} from '../db'
import {notesTbl} from '../db/schema'
import {authEndpointsFactory} from '../endpointsFactory'
import {z} from 'zod'

const updateSchema = z.object({
  id: z.string().uuid(),
  cipher_text: z.string(),
  iv: z.string(),
  updated_at: z.number().int().positive(),
})
type Update = z.infer<typeof updateSchema>
const createSchema = z.object({
  id: z.string().uuid(),
  created_at: z.number().int().positive(),
  cipher_text: z.string(),
  iv: z.string(),
})
type Create = z.infer<typeof createSchema>
const deleteSchema = z.object({
  id: z.string().uuid(),
  deleted_at: z.number().int().positive(),
})
type Delete = z.infer<typeof deleteSchema>

export const pullNotesEndpoint = authEndpointsFactory.build({
  method: 'get',
  input: z.object({last_synced_at: z.number().int().nonnegative()}),
  output: z.object({
    creates: z.array(createSchema),
    updates: z.array(updateSchema),
    deletes: z.array(deleteSchema),
  }),
  handler: async ({input: {last_synced_at}, options: {user}}) => {
    // creates
    const dbCreates = await db
      .select()
      .from(notesTbl)
      .where(
        and(
          eq(notesTbl.user_id, user.id),
          gt(notesTbl.serverside_created_at, last_synced_at),
          isNotNull(notesTbl.cipher_text),
          isNotNull(notesTbl.iv)
        )
      )
    const creates: Create[] = dbCreates.map((n) => ({
      id: n.clientside_id,
      created_at: n.clientside_created_at,
      cipher_text: n.cipher_text!,
      iv: n.iv!,
    }))
    const createIds = creates.map((c) => c.id)

    // updates
    const dbUpdates = await db
      .select()
      .from(notesTbl)
      .where(
        and(
          eq(notesTbl.user_id, user.id),
          gt(notesTbl.serverside_updated_at, last_synced_at),
          not(inArray(notesTbl.clientside_id, createIds)),
          isNotNull(notesTbl.cipher_text),
          isNotNull(notesTbl.iv)
        )
      )
    const updates: Update[] = dbUpdates.map((n) => ({
      id: n.clientside_id,
      cipher_text: n.cipher_text!,
      iv: n.iv!,
      updated_at: n.clientside_updated_at,
    }))

    // deletes
    const dbDeletes = await db
      .select()
      .from(notesTbl)
      .where(and(eq(notesTbl.user_id, user.id), gt(notesTbl.serverside_deleted_at, last_synced_at)))
    const deletes: Delete[] = dbDeletes.map((d) => ({
      id: d.clientside_id,
      deleted_at: d.clientside_deleted_at!,
    }))

    return {creates, updates, deletes}
  },
})

export const pushNotesEndpoint = authEndpointsFactory.build({
  method: 'post',
  input: z.object({
    creates: z.array(createSchema),
    updates: z.array(updateSchema),
    deletes: z.array(deleteSchema),
  }),
  output: z.object({}),
  handler: async ({input: {creates, updates, deletes}, options: {user}}) => {
    await db.transaction(async (tx) => {
      // creates
      await tx.insert(notesTbl).values(
        creates.map((n) => ({
          user_id: user.id,
          clientside_id: n.id,
          cipher_text: n.cipher_text,
          iv: n.iv,
          clientside_created_at: n.created_at,
          clientside_updated_at: n.created_at,
        }))
      )

      // updates
      for (const u of updates) {
        await tx
          .update(notesTbl)
          .set({cipher_text: u.cipher_text, iv: u.iv, clientside_updated_at: u.updated_at})
          .where(and(eq(notesTbl.user_id, user.id), eq(notesTbl.clientside_id, u.id)))
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
          .where(and(eq(notesTbl.user_id, user.id), eq(notesTbl.clientside_id, d.id)))
      }
    })
    return {}
  },
})
