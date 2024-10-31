export function generateId() {
  const timestamp = Date.now().toString(36)
  const randomBytes = Math.floor(Math.random() * 0xffffffff).toString(36)
  return `${timestamp}-${randomBytes}`
}
