import {and, eq, gt, inArray, isNotNull, not} from 'drizzle-orm'
import {db} from '../db'
import {notesTbl, usersTbl} from '../db/schema'
import {authEndpointsFactory} from '../endpointsFactory'
import {z} from 'zod'
import createHttpError from 'http-errors'

const updateSchema = z.object({
  id: z.string().uuid(),
  cipher_text: z.string(),
  iv: z.string(),
  updated_at: z.number().int().positive(),
  version: z.number().int().positive(),
})
type Update = z.infer<typeof updateSchema>
const createSchema = z.object({
  id: z.string().uuid(),
  created_at: z.number().int().positive(),
  updated_at: z.number().int().positive(),
  cipher_text: z.string(),
  iv: z.string(),
})
type Create = z.infer<typeof createSchema>
const deleteSchema = z.object({
  id: z.string().uuid(),
  deleted_at: z.number().int().positive(),
})
type Delete = z.infer<typeof deleteSchema>

export const syncNotesEndpoint = authEndpointsFactory.build({
  method: 'post',
  input: z.object({
    last_synced_to: z.number().int().nonnegative(),
    creates: z.array(createSchema),
    updates: z.array(updateSchema),
    deletes: z.array(deleteSchema),
    sync_token: z.string().base64().length(24),
  }),
  output: z.object({
    creates: z.array(createSchema),
    updates: z.array(updateSchema),
    deletes: z.array(deleteSchema),
    synced_to: z.number().int().positive(),
  }),
  handler: async ({
    input: {last_synced_to, creates, updates, deletes, sync_token},
    options: {user},
  }) => {
    if (!user.sync_token) {
      await db.update(usersTbl).set({sync_token}).where(eq(usersTbl.id, user.id))
    } else if (sync_token !== user.sync_token) {
      throw createHttpError(400, 'Invalid sync token')
    }
    await pushNotes(creates, updates, deletes, user.id)
    return await getPullData(last_synced_to, user.id)
  },
})

const getPullData = async (last_synced_to: number, userId: number) => {
  // creates
  const dbCreates = await db
    .select()
    .from(notesTbl)
    .where(
      and(
        eq(notesTbl.user_id, userId),
        gt(notesTbl.serverside_created_at, last_synced_to),
        isNotNull(notesTbl.cipher_text),
        isNotNull(notesTbl.iv)
      )
    )
  const creates: Create[] = dbCreates.map((n) => ({
    id: n.clientside_id,
    created_at: n.clientside_created_at,
    updated_at: n.clientside_updated_at,
    cipher_text: n.cipher_text!,
    iv: n.iv!,
  }))
  const createIds = creates.map((c) => c.id)
  const maxCreatedAt = Math.max(...dbCreates.map((c) => c.serverside_created_at))

  // updates
  const dbUpdates = await db
    .select()
    .from(notesTbl)
    .where(
      and(
        eq(notesTbl.user_id, userId),
        gt(notesTbl.serverside_updated_at, last_synced_to),
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
    version: n.version,
  }))
  const maxUpdatedAt = Math.max(...dbUpdates.map((u) => u.serverside_updated_at))

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
    creates,
    updates,
    deletes,
    synced_to: Math.max(last_synced_to, maxCreatedAt, maxUpdatedAt, maxDeletedAt),
  }
}

export const pushNotes = (
  creates: Create[],
  updates: Update[],
  deletes: Delete[],
  userId: number
) =>
  db.transaction(async (tx) => {
    // creates
    if (creates.length > 0) {
      const clientsideIds = creates.map((n) => n.id)
      const existingNotes = await tx
        .select()
        .from(notesTbl)
        .where(inArray(notesTbl.clientside_id, clientsideIds))
      const existingIds = existingNotes.map((n) => n.clientside_id)
      const newCreates = creates.filter((n) => !existingIds.includes(n.id))
      if (newCreates.length === 0) return
      await tx.insert(notesTbl).values(
        newCreates.map((n) => ({
          user_id: userId,
          clientside_id: n.id,
          cipher_text: n.cipher_text,
          iv: n.iv,
          clientside_created_at: n.created_at,
          clientside_updated_at: n.updated_at,
        }))
      )
      // if push succeeded and pull failed and we push again,
      // we need to update in case the text changed
      const createUpdates = creates.filter((n) => existingIds.includes(n.id))
      for (const cu of createUpdates) {
        await tx
          .update(notesTbl)
          .set({
            cipher_text: cu.cipher_text,
            iv: cu.iv,
            clientside_created_at: cu.created_at,
            clientside_updated_at: cu.updated_at,
            version: existingNotes.find((n) => n.clientside_id === cu.id)!.version + 1,
          })
          .where(and(eq(notesTbl.user_id, userId), eq(notesTbl.clientside_id, cu.id)))
      }
    }

    // updates
    for (const u of updates) {
      await tx
        .update(notesTbl)
        .set({cipher_text: u.cipher_text, iv: u.iv, clientside_updated_at: u.updated_at})
        .where(and(eq(notesTbl.user_id, userId), eq(notesTbl.clientside_id, u.id)))
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
