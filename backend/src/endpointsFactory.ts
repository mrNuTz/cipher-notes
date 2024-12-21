import {EndpointsFactory, ensureHttpError, ResultHandler} from 'express-zod-api'
import {authMiddleware, rateLimitMiddleware} from './middleware'
import {z} from 'zod'
import {env} from './env'

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
    if (
      output &&
      typeof output.access_token === 'string' &&
      typeof output.session_id === 'number'
    ) {
      response.cookie(
        'session',
        JSON.stringify({access_token: output.access_token, session_id: output.session_id}),
        {
          httpOnly: true,
          secure: env.NODE_ENV === 'production',
          maxAge: 1000 * 60 * 60 * 24 * 7,
          sameSite: env.NODE_ENV === 'production' ? 'none' : 'strict',
        }
      )
      delete output.access_token
    }
    response.status(200).json({success: true, data: output})
  },
})

export const endpointsFactory = new EndpointsFactory(resultHandler).addMiddleware(
  rateLimitMiddleware
)

export const authEndpointsFactory = endpointsFactory.addMiddleware(authMiddleware)
