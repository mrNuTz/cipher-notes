import {createConfig} from 'express-zod-api'
import {env} from './env'

export const config = createConfig({
  http: {
    listen: env.PORT,
  },
  cors: ({defaultHeaders}) => ({
    ...defaultHeaders,
    'Access-Control-Allow-Origin': env.ACCESS_CONTROL_ALLOW_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
  }),
})
