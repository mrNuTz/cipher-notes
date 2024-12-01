import {Routing} from 'express-zod-api'
import {helloWorldEndpoint} from './endpoints/hello'
import {loginCodeEndpoint, loginEmailEndpoint} from './endpoints/login'

export const routing: Routing = {
  hello: helloWorldEndpoint,
  loginEmail: loginEmailEndpoint,
  loginCode: loginCodeEndpoint,
}
