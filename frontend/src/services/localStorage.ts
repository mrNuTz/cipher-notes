import {UserState} from '../state/user'

export const storeUser = (user: UserState['user']): Promise<void> =>
  Promise.resolve().then(() => {
    localStorage.setItem('user', JSON.stringify(user))
  })

export const loadUser = (): Promise<UserState['user'] | null> =>
  Promise.resolve().then(() => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  })
