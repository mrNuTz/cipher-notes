import {EndpointsFactory, ensureHttpError, ResultHandler} from 'express-zod-api'
import {authMiddleware} from './middleware'
import {z} from 'zod'

const resultHandler = new ResultHandler({
  positive: (data) => ({
    schema: z.object({success: z.literal(true), data}),
    mimeType: 'application/json',
  }),
  negative: z.object({success: z.literal(false), error: z.string(), statusCode: z.number()}),
  handler: ({error, output, response, logger}) => {
    if (error) {
      logger.error(error.stack ?? error.toString())
      const {statusCode, message} = ensureHttpError(error)
      return void response.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? 'Internal Server Error' : message,
        statusCode,
      })
    }
    response.status(200).json({success: true, data: output})
  },
})

export const endpointsFactory = new EndpointsFactory(resultHandler)

export const authEndpointsFactory = endpointsFactory.addMiddleware(authMiddleware)
