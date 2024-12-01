export const generateLoginCode = () => {
  return Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0')
}

export const generateAccessToken = () => {
  return crypto.randomUUID()
}
