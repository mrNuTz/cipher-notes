import {createConfig} from 'express-zod-api'
import {env} from './env'

export const config = createConfig({
  http: {
    listen: env.PORT,
  },
  cors: true,
})
