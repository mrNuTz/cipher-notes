import {createServer} from 'express-zod-api'
import {config} from './config'
import {routing} from './routing'
import {rateLimit} from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
})

createServer(config, routing).then((server) => {
  server.app.use(limiter)
})
