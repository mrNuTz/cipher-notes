import {io} from 'socket.io-client'
import {setState} from './state/store'

const socket = io({
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
})
socket.on('connect_error', (err) => {
  console.error('socket connect_error', err)
})
socket.on('connect', () => {
  setState((s) => {
    s.user.connected = true
  })
})
socket.on('disconnect', () => {
  setState((s) => {
    s.user.connected = false
  })
})

export default socket
