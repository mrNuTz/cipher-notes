import {WritableDraft} from 'immer'
import {last} from '../util/misc'
import {RootState, setState} from './store'

export type Message = {
  title: string
  text: string
}
export type MessagesState = {
  messages: Message[]
}
export const messagesInit: MessagesState = {
  messages: [],
}

// actions
export const showMessage = (state: WritableDraft<RootState>, message: Message) => {
  state.messages.messages.push(message)
}
export const closeMessage = () =>
  setState((state) => {
    state.messages.messages.pop()
  })

// selectors
export const selectLastMessage = (state: RootState) => last(state.messages.messages)
