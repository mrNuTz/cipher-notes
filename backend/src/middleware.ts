import {Method, Middleware} from 'express-zod-api'

export const methodProviderMiddleware = new Middleware({
  handler: async ({request}) => ({
    method: request.method.toLowerCase() as Method,
  }),
})
