import {defaultEndpointsFactory} from 'express-zod-api'
import {z} from 'zod'
import {methodProviderMiddleware} from '../middleware.js'
import {db} from '../db/index.js'
import {usersTbl} from '../db/schema.js'

export const helloWorldEndpoint = defaultEndpointsFactory
  .addMiddleware(methodProviderMiddleware)
  .build({
    method: ['get', 'post'],
    input: z.object({}),
    output: z.object({
      array: z.array(z.string()),
    }),
    handler: async ({input, options, logger}) => {
      logger.debug('input', input)
      if (options.method === 'post') {
        const ins: typeof usersTbl.$inferInsert = {
          email: 'test@test.com',
        }
        await db.insert(usersTbl).values(ins)
      }
      const res = await db.select().from(usersTbl)
      return {array: res.map((r) => r.email)}
    },
  })
