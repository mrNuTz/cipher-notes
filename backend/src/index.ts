import {createServer} from 'express-zod-api'
import {config} from './config'
import {routing} from './routing'

console.log('NODE_ENV', process.env.NODE_ENV)

createServer(config, routing)
