export const bisectBy = <T>(arr: T[], pred: (x: T) => boolean): readonly [T[], T[]] => {
  const ts: T[] = []
  const fs: T[] = []
  for (const x of arr) {
    if (pred(x)) {
      ts.push(x)
    } else {
      fs.push(x)
    }
  }
  return [ts, fs]
}

export const parseCookieHeader = (
  cookieHeader: string | undefined | null
): Record<string, string> => {
  if (!cookieHeader) {
    return {}
  }
  return cookieHeader.split('; ').reduce((acc, row) => {
    const [key, value] = row.split('=')
    if (!key || !value) {
      return acc
    }
    acc[decodeURIComponent(key)] = decodeURIComponent(value)
    return acc
  }, {} as Record<string, string>)
}
