import {Routing} from 'express-zod-api'
import {helloEndpoint} from './endpoints/hello'
import {loginCodeEndpoint, sendLoginCodeEndpoint, registerEmailEndpoint} from './endpoints/login'
import {syncNotesEndpoint} from './endpoints/syncNotes'
import {deleteNotesEndpoint} from './endpoints/deleteNotes'
import {sendConfirmCodeEndpoint} from './endpoints/sendConfirmCode'

export const routing: Routing = {
  hello: helloEndpoint,
  registerEmail: registerEmailEndpoint,
  sendLoginCode: sendLoginCodeEndpoint,
  loginCode: loginCodeEndpoint,
  syncNotes: syncNotesEndpoint,
  deleteNotes: deleteNotesEndpoint,
  sendConfirmCode: sendConfirmCodeEndpoint,
}
