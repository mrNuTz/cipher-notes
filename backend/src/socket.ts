import {Server as SocketIOServer, Socket} from 'socket.io'
import {Server} from 'http'
import {JSONCookie, signedCookie} from 'cookie-parser'
import {env} from './env'
import {sessionSchema} from './business/sessionSchema'
import {parseCookieHeader} from './util/misc'
import {db} from './db'
import {sessionsTbl} from './db/schema'
import {eq} from 'drizzle-orm'
import {verifyToken} from './util/hash'

export const userToSessionToSocket = new Map<number, Map<number, Socket>>()

export const createSocketServer = (server: Server) => {
  const io = new SocketIOServer(server)

  io.use(async (socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie
    const {session: sessionCookie} = parseCookieHeader(cookieHeader)
    if (!sessionCookie) {
      return next(new Error('No session cookie found'))
    }
    if (!sessionCookie.startsWith('s:j:')) {
      return next(new Error('Invalid session cookie'))
    }
    const sessionJson = signedCookie(decodeURIComponent(sessionCookie), env.COOKIE_SECRET)
    if (!sessionJson) {
      return next(new Error('Invalid session cookie'))
    }
    const sessionUnknown = JSONCookie(sessionJson)
    const sessionHandle = sessionSchema.parse(sessionUnknown)

    const [session] = await db
      .select()
      .from(sessionsTbl)
      .where(eq(sessionsTbl.id, sessionHandle.session_id))
      .limit(1)
    if (!session) {
      return next(new Error('Invalid session'))
    }
    const {access_token_hash: storedHash, access_token_salt, created_at} = session
    if (!verifyToken(sessionHandle.access_token, storedHash, access_token_salt)) {
      return next(new Error('Invalid access token'))
    }
    if (Date.now() - created_at > 1000 * 60 * Number(env.SESSION_TTL_MIN)) {
      return next(new Error('Session expired'))
    }

    socket.data.sessionId = session.id
    socket.data.userId = session.user_id
    next()
  })

  io.on('connection', (socket) => {
    const sessionId = socket.data.sessionId as number
    const userId = socket.data.userId as number

    console.info(`socket connected: session ${sessionId} with socket id ${socket.id}`)

    const map = userToSessionToSocket.get(userId)
    if (!map) {
      userToSessionToSocket.set(userId, new Map([[sessionId, socket]]))
    } else {
      map.set(sessionId, socket)
    }

    socket.on('disconnect', () => {
      console.info(`socket disconnected: session ${sessionId} with socket id ${socket.id}`)
      userToSessionToSocket.get(userId)!.delete(sessionId)
    })
  })
}
