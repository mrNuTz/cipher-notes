import {Method, Middleware} from 'express-zod-api'
import {env} from './env'
import {usersTbl} from './db/schema'
import {db} from './db'
import {eq} from 'drizzle-orm'
import createHttpError from 'http-errors'

export const methodProviderMiddleware = new Middleware({
  handler: async ({request}) => ({
    method: request.method.toLowerCase() as Method,
  }),
})

const ipToCount = new Map<string, number>()
const windowMs = Number(env.RATE_WINDOW_SEC) * 1000
const limit = Number(env.RATE_LIMIT)
const getInterval = () => Math.floor(Date.now() / windowMs)
let lastInterval = getInterval()

export const rateLimitMiddleware = new Middleware({
  handler: async ({request}) => {
    const ip = request.ip
    if (!ip) {
      throw new Error('No IP address')
    }
    const interval = getInterval()
    if (interval !== lastInterval) {
      ipToCount.clear()
      lastInterval = interval
    }
    const count = (ipToCount.get(ip) ?? 0) + 1
    ipToCount.set(ip, count)
    if (count > limit) {
      throw createHttpError(429, 'Rate limit exceeded')
    }
    return {}
  },
})

export const authMiddleware = new Middleware({
  handler: async ({request}) => {
    const cookies = request.cookies
    const access_token: any = cookies.access_token
    if (!access_token) {
      throw createHttpError(401, 'No access token')
    }
    const users = await db
      .select()
      .from(usersTbl)
      .where(eq(usersTbl.access_token, String(access_token)))
    if (users.length !== 1) {
      throw createHttpError(401, 'Invalid access token')
    }
    return {user: users[0]}
  },
})
