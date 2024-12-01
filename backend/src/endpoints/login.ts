import {defaultEndpointsFactory} from 'express-zod-api'
import {z} from 'zod'
import {db} from '../db/index'
import {usersTbl} from '../db/schema'
import {eq} from 'drizzle-orm'
import {generateAccessToken, generateLoginCode} from '../business/misc'
import {sendLoginCode} from '../services/mail'

export const loginEmailEndpoint = defaultEndpointsFactory.build({
  method: 'post',
  input: z.object({
    email: z.string().email(),
  }),
  output: z.discriminatedUnion('success', [
    z.object({success: z.literal(false), error: z.string()}),
    z.object({success: z.literal(true)}),
  ]),
  handler: async ({input: {email}}) => {
    const users = await db.select().from(usersTbl).where(eq(usersTbl.email, email))
    if (users.length !== 1) {
      return {error: 'User not found', success: false} as const
    }
    const user = users[0]

    const lastCodeSent = user.login_code_created_at
    if (lastCodeSent && Date.now() - lastCodeSent < 10 * 60 * 1000) {
      return {error: 'Code already sent recently', success: false} as const
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

    return {success: true} as const
  },
})

export const loginCodeEndpoint = defaultEndpointsFactory.build({
  method: 'post',
  input: z.object({
    email: z.string().email(),
    login_code: z.string().length(6),
  }),
  output: z.discriminatedUnion('success', [
    z.object({success: z.literal(false), error: z.string()}),
    z.object({success: z.literal(true), access_token: z.string()}),
  ]),
  handler: async ({input}) => {
    const users = await db.select().from(usersTbl).where(eq(usersTbl.email, input.email))
    if (users.length !== 1) {
      return {error: 'User not found', success: false} as const
    }
    const user = users[0]

    if (!user.login_code || !user.login_code_created_at) {
      return {error: 'No login code set', success: false} as const
    }

    if (Date.now() - user.login_code_created_at > 10 * 60 * 1000) {
      return {error: 'Login code expired', success: false} as const
    }

    if (user.login_tries_left === 0) {
      return {error: 'No tries left', success: false} as const
    }

    if (user.login_code !== input.login_code) {
      await db
        .update(usersTbl)
        .set({login_tries_left: user.login_tries_left - 1})
        .where(eq(usersTbl.id, user.id))
      return {error: 'Invalid login code', success: false} as const
    }

    const accessToken = generateAccessToken()
    await db
      .update(usersTbl)
      .set({access_token: accessToken, access_token_created_at: Date.now()})
      .where(eq(usersTbl.id, user.id))

    return {success: true, access_token: accessToken} as const
  },
})
