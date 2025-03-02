import {createConfig} from 'express-zod-api'
import {env} from './env'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import type {Application} from 'express'

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
    ;(app as Application).set('trust proxy', 1) // number of proxies between user and server
    app.use(
      rateLimit({
        limit: Number(env.RATE_LIMIT),
        windowMs: Number(env.RATE_WINDOW_SEC) * 1000,
        handler: (_, res) => {
          res.status(429).json({
            success: false,
            error: 'Too many requests',
            statusCode: 429,
          })
        },
      })
    )
    app.use(cookieParser(env.COOKIE_SECRET))
    app.get('/ip', (req, res) => {
      res.send(req.ip)
    })
  },
  startupLogo: false,
})
