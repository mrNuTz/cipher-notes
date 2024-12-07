import {and, eq, gt, inArray, not} from 'drizzle-orm'
import {db} from '../db'
import {notesDeletesTbl, notesTbl} from '../db/schema'
import {authEndpointsFactory} from '../endpointsFactory'
import {z} from 'zod'

const updateSchema = z.object({
  id: z.string().uuid(),
  cipher_text: z.string(),
  updated_at: z.number().int().positive(),
})
const createSchema = z.object({
  id: z.string().uuid(),
  created_at: z.number().int().positive(),
  cipher_text: z.string(),
})
const deleteSchema = z.object({
  id: z.string().uuid(),
  deleted_at: z.number().int().positive(),
})

export const pullNotesEndpoint = authEndpointsFactory.build({
  method: 'get',
  input: z.object({last_synced_at: z.number().int().nonnegative()}),
  output: z.object({
    creates: z.array(createSchema),
    updates: z.array(updateSchema),
    deletes: z.array(deleteSchema),
  }),
  handler: async ({input: {last_synced_at}, options: {user}}) => {
    const dbCreates = await db
      .select()
      .from(notesTbl)
      .where(and(eq(notesTbl.user_id, user.id), gt(notesTbl.clientside_created_at, last_synced_at)))
    const creates = dbCreates.map((n) => ({
      id: n.clientside_id,
      created_at: n.clientside_created_at,
      cipher_text: n.cipher_text,
    }))
    const createIds = creates.map((c) => c.id)

    const dbUpdates = await db
      .select()
      .from(notesTbl)
      .where(
        and(
          eq(notesTbl.user_id, user.id),
          gt(notesTbl.clientside_updated_at, last_synced_at),
          not(inArray(notesTbl.clientside_id, createIds))
        )
      )
    const updates = dbUpdates.map((n) => ({
      id: n.clientside_id,
      cipher_text: n.cipher_text,
      updated_at: n.clientside_updated_at,
    }))

    const dbDeletes = await db
      .select()
      .from(notesDeletesTbl)
      .where(
        and(
          eq(notesDeletesTbl.user_id, user.id),
          gt(notesDeletesTbl.clientside_deleted_at, last_synced_at)
        )
      )
    const deletes = dbDeletes.map((d) => ({
      id: d.clientside_id,
      deleted_at: d.clientside_deleted_at,
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
          clientside_created_at: n.created_at,
          clientside_updated_at: n.created_at,
        }))
      )

      // updates
      for (const u of updates) {
        await tx
          .update(notesTbl)
          .set({cipher_text: u.cipher_text, clientside_updated_at: u.updated_at})
          .where(and(eq(notesTbl.user_id, user.id), eq(notesTbl.clientside_id, u.id)))
      }

      // deletes
      const deleteIds = deletes.map((d) => d.id)
      await tx
        .delete(notesTbl)
        .where(and(eq(notesTbl.user_id, user.id), inArray(notesTbl.clientside_id, deleteIds)))
      await tx.insert(notesDeletesTbl).values(
        deletes.map((d) => ({
          user_id: user.id,
          clientside_id: d.id,
          clientside_deleted_at: d.deleted_at,
        }))
      )
    })
    return {}
  },
})
