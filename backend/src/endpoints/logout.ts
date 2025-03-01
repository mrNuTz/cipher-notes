import {z} from 'zod'
import {authEndpointsFactory} from '../endpointsFactory'
import {db} from '../db'
import {sessionsTbl} from '../db/schema'
import {eq} from 'drizzle-orm'

export const logoutEndpoint = authEndpointsFactory.build({
  method: 'post',
  output: z.object({remove_session_cookie: z.boolean()}),
  handler: async ({options: {session_id}}) => {
    await db.delete(sessionsTbl).where(eq(sessionsTbl.id, session_id))
    return {remove_session_cookie: true}
  },
})
