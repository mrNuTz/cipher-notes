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
