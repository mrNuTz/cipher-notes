import {endpointsFactory} from '../endpointsFactory'
import {z} from 'zod'
import {db} from '../db/index'
import {usersTbl} from '../db/schema'
import {eq} from 'drizzle-orm'
import {generateAccessToken, generateLoginCode} from '../business/misc'
import {sendLoginCode} from '../services/mail'
import createHttpError from 'http-errors'

export const registerEmailEndpoint = endpointsFactory.build({
  method: 'post',
  input: z.object({
    email: z.string().email(),
  }),
  output: z.object({success: z.literal(true)}),
  handler: async ({input: {email}}) => {
    const users = await db.select().from(usersTbl).where(eq(usersTbl.email, email))
    if (users.length === 1) {
      throw createHttpError(400, 'User already exists')
    }
    await db.insert(usersTbl).values({email})
    return {success: true} as const
  },
})

export const loginEmailEndpoint = endpointsFactory.build({
  method: 'post',
  input: z.object({
    email: z.string().email(),
  }),
  output: z.object({}),
  handler: async ({input: {email}}) => {
    const users = await db.select().from(usersTbl).where(eq(usersTbl.email, email))
    if (users.length !== 1) {
      throw createHttpError(400, 'User not found')
    }
    const user = users[0]

    const lastCodeSent = user.login_code_created_at
    if (lastCodeSent && Date.now() - lastCodeSent < 10 * 60 * 1000) {
      throw createHttpError(400, 'Code already sent recently')
    }

    const loginCode = generateLoginCode()
    await sendLoginCode(email, loginCode)

    await db
      .update(usersTbl)
      .set({
        login_code: loginCode,
        login_code_created_at: Date.now(),
        login_tries_left: 3,
      })
      .where(eq(usersTbl.id, user.id))

    return {}
  },
})

export const loginCodeEndpoint = endpointsFactory.build({
  method: 'post',
  input: z.object({
    email: z.string().email(),
    login_code: z.string().length(6),
  }),
  output: z.object({}),
  handler: async ({input}) => {
    const users = await db.select().from(usersTbl).where(eq(usersTbl.email, input.email))
    if (users.length !== 1) {
      throw createHttpError(400, 'User not found')
    }
    const user = users[0]

    if (!user.login_code || !user.login_code_created_at) {
      throw createHttpError(400, 'No login code set')
    }

    if (Date.now() - user.login_code_created_at > 10 * 60 * 1000) {
      throw createHttpError(400, 'Login code expired')
    }

    if (user.login_tries_left === 0) {
      throw createHttpError(400, 'No tries left')
    }

    if (user.login_code !== input.login_code) {
      await db
        .update(usersTbl)
        .set({login_tries_left: user.login_tries_left - 1})
        .where(eq(usersTbl.id, user.id))
      throw createHttpError(400, 'Invalid login code')
    }

    const accessToken = generateAccessToken()
    await db
      .update(usersTbl)
      .set({access_token: accessToken, access_token_created_at: Date.now()})
      .where(eq(usersTbl.id, user.id))

    return {}
  },
})
