import {defaultEndpointsFactory} from 'express-zod-api'
import {rateLimitMiddleware} from './middleware'

export const endpointsFactory = defaultEndpointsFactory.addMiddleware(rateLimitMiddleware)
