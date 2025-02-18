import {Method, Middleware} from 'express-zod-api'
import {env} from './env'
import {sessionsTbl, usersTbl} from './db/schema'
import {db} from './db'
import {eq} from 'drizzle-orm'
import createHttpError from 'http-errors'
import {z} from 'zod'
import {verifyToken} from './util/hash'

export const methodProviderMiddleware = new Middleware({
  handler: async ({request}) => ({
    method: request.method.toLowerCase() as Method,
  }),
})

export const authMiddleware = new Middleware({
  input: z.object({
    session: z.object({
      access_token: z.string(),
      session_id: z.number(),
    }),
  }),
  handler: async ({input}) => {
    const {access_token, session_id} = input.session
    const sessions = await db
      .select()
      .from(sessionsTbl)
      .where(eq(sessionsTbl.id, session_id))
      .limit(1)
    if (sessions.length !== 1) {
      throw createHttpError(401, 'Invalid session')
    }
    const {access_token_hash: storedHash, access_token_salt, created_at} = sessions[0]
    if (!verifyToken(access_token, storedHash, access_token_salt)) {
      throw createHttpError(401, 'Invalid access token')
    }
    if (Date.now() - created_at > 1000 * 60 * Number(env.SESSION_TTL_MIN)) {
      throw createHttpError(401, 'Session expired')
    }
    const users = await db.select().from(usersTbl).where(eq(usersTbl.id, sessions[0].user_id))

    if (users.length !== 1) {
      throw createHttpError(401, 'User not found')
    }
    return {user: users[0]}
  },
})
