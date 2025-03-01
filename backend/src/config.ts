import {createConfig} from 'express-zod-api'
import {env} from './env'
import cookieParser from 'cookie-parser'

export const config = createConfig({
  http: {
    listen: env.PORT,
  },
  cors: ({defaultHeaders}) => ({
    ...defaultHeaders,
    'Access-Control-Allow-Origin': env.ACCESS_CONTROL_ALLOW_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
  }),
  beforeRouting: ({app}) => {
    app.use(cookieParser(env.COOKIE_SECRET))
  },
})
