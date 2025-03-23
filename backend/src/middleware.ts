import {Method, Middleware} from 'express-zod-api'
import {env} from './env'
import {sessionsTbl, usersTbl} from './db/schema'
import {db} from './db'
import {eq} from 'drizzle-orm'
import createHttpError from 'http-errors'
import {verifyToken} from './util/hash'
import {sessionSchema} from './business/sessionSchema'

export const methodProviderMiddleware = new Middleware({
  handler: async ({request}) => ({
    method: request.method.toLowerCase() as Method,
  }),
})

export const authMiddleware = new Middleware({
  handler: async ({request}) => {
    const cookieSession = request.signedCookies.session
    if (!cookieSession) {
      throw createHttpError(401, 'No session cookie')
    }
    const {access_token, session_id} = sessionSchema.parse(cookieSession)
    const [session] = await db
      .select()
      .from(sessionsTbl)
      .where(eq(sessionsTbl.id, session_id))
      .limit(1)
    if (!session) {
      throw createHttpError(401, 'Invalid session')
    }
    const {access_token_hash: storedHash, access_token_salt, created_at} = session
    if (!verifyToken(access_token, storedHash, access_token_salt)) {
      throw createHttpError(401, 'Invalid access token')
    }
    if (Date.now() - created_at > 1000 * 60 * Number(env.SESSION_TTL_MIN)) {
      throw createHttpError(401, 'Session expired')
    }
    const [user] = await db.select().from(usersTbl).where(eq(usersTbl.id, session.user_id))
    if (!user) {
      throw createHttpError(401, 'User not found')
    }
    return {user, session_id}
  },
})
