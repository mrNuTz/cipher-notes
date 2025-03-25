import {z} from 'zod'
import {authEndpointsFactory} from '../endpointsFactory'
import {db} from '../db'
import {notesTbl, usersTbl} from '../db/schema'
import createHttpError from 'http-errors'
import {eq} from 'drizzle-orm'

export const deleteNotesEndpoint = authEndpointsFactory.build({
  method: 'post',
  input: z.object({
    confirm: z.string().length(6),
  }),
  output: z.object({}),
  handler: async ({options: {user}, input: {confirm}}) => {
    if (!user.confirm_code) {
      throw createHttpError(400, 'Confirm code not set')
    }
    if (user.confirm_code_tries_left <= 0) {
      throw createHttpError(400, 'Confirm code tries left exceeded')
    }
    if (
      user.confirm_code_created_at &&
      user.confirm_code_created_at + 10 * 60 * 1000 < Date.now()
    ) {
      throw createHttpError(400, 'Confirm code expired')
    }
    if (confirm !== user.confirm_code) {
      await db
        .update(usersTbl)
        .set({confirm_code_tries_left: user.confirm_code_tries_left - 1})
        .where(eq(usersTbl.id, user.id))
      throw createHttpError(400, 'Confirm code does not match')
    }
    await db.transaction(async (tx) => {
      await tx.delete(notesTbl).where(eq(notesTbl.user_id, user.id))
      await tx.update(usersTbl).set({sync_token: null}).where(eq(usersTbl.id, user.id))
      await tx
        .update(usersTbl)
        .set({confirm_code: null, confirm_code_tries_left: 0, confirm_code_created_at: null})
        .where(eq(usersTbl.id, user.id))
    })
    return {}
  },
})
