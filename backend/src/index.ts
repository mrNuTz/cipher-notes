import {createServer} from 'express-zod-api'
import {config} from './config'
import {routing} from './routing'
import {startCronJobs} from './cron'

console.log('NODE_ENV', process.env.NODE_ENV)

startCronJobs()
createServer(config, routing)
