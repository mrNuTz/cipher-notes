import {io} from 'socket.io-client'

const socket = io({
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
})
socket.on('connect_error', (err) => {
  console.error('socket connect_error', err)
})

export default socket
