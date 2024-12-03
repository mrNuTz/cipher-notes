import {Method, Middleware} from 'express-zod-api'
import {env} from './env'

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
    console.log('rateLimitMiddleware')
    const ip = request.ip
    if (!ip) {
      throw 'No IP address'
    }
    const interval = getInterval()
    if (interval !== lastInterval) {
      ipToCount.clear()
      lastInterval = interval
    }
    const count = (ipToCount.get(ip) ?? 0) + 1
    ipToCount.set(ip, count)
    if (count > limit) {
      throw 'Rate limit exceeded'
    }
    return {}
  },
})
