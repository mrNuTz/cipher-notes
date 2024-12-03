import {endpointsFactory} from '../endpointsFactory'
import {z} from 'zod'
import {methodProviderMiddleware} from '../middleware'

export const helloWorldEndpoint = endpointsFactory.addMiddleware(methodProviderMiddleware).build({
  method: ['get', 'post'],
  input: z.object({}),
  output: z.object({
    array: z.array(z.string()),
  }),
  handler: async ({input, logger}) => {
    logger.debug('input', input)
    return {array: ['foo']}
  },
})
