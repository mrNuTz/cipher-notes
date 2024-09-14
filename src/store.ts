import {create} from 'zustand'
import {immer} from 'zustand/middleware/immer'

type State = {
  count: number
}
const init: State = {
  count: 0,
}
export const useSelector = create<State>()(immer(() => init))

export const inc = () =>
  useSelector.setState((state) => {
    state.count++
  })
