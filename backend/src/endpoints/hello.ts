import {authEndpointsFactory} from '../endpointsFactory'
import {z} from 'zod'

export const helloEndpoint = authEndpointsFactory.build({
  method: 'get',
  output: z.object({
    email: z.string(),
  }),
  handler: async ({options: {user}}) => {
    return {email: user.email}
  },
})
