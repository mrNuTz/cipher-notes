import {createServer} from 'express-zod-api'
import {config} from './config'
import {routing} from './routing'
import {startCronJobs} from './cron'
import {createSocketServer} from './socket'

console.info('NODE_ENV', process.env.NODE_ENV)

startCronJobs()
const {servers} = await createServer(config, routing)
const server = servers[0]!

createSocketServer(server)
