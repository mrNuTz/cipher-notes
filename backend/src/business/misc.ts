import {generateSalt, hashToken} from '../util/hash'

export const generateLoginCode = () => {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0')
}

export const generateSession = () => {
  const accessToken = crypto.randomUUID()
  const salt = generateSalt()
  const hash = hashToken(accessToken, salt)
  return {accessToken, salt, hash}
}
