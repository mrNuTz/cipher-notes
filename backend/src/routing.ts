import {Routing} from 'express-zod-api'
import {helloWorldEndpoint} from './endpoints/hello.js'

export const routing: Routing = {
  hello: helloWorldEndpoint,
}
