let counter = 0
export function generateId() {
  const timestamp = Date.now().toString(36).padStart(10, '0')
  const random = Math.floor(Math.random() * 36 ** 10)
    .toString(36)
    .padStart(10, '0')
  ++counter
  const c = counter.toString(36).padStart(5, '0')
  return `${timestamp}-${random}-${c}`
}
