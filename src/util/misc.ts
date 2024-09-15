/* eslint-disable @typescript-eslint/no-explicit-any */
export const compare = (a: any, b: any) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.min(a.length, b.length)
    for (let i = 0; i < len; ++i) {
      const _a = a[i]
      const _b = b[i]
      if (_a < _b) return -1
      else if (_a > _b) return 1
    }
  }
  return a < b ? -1 : a > b ? 1 : 0
}

export const sort = <T>(arr: Array<T>, cmp: (a: T, b: T) => number = compare) => arr.slice().sort(cmp)

export const bySelector =
  <Item>(selector: (item: Item) => any) =>
  (a: Item, b: Item) =>
    compare(selector(a), selector(b))

export const byProp =
  <Key extends keyof any, Item extends {[key in Key]: any}>(key: Key, desc?: boolean) =>
  (a: Item, b: Item) =>
    desc ? compare(b[key], a[key]) : compare(a[key], b[key])

const wordSplitter = /[\t\n ]+/g
export const splitWords = (text: string): string[] => text.split(wordSplitter)
export const last = <T>(array: T[]): T | undefined => array[array.length - 1]

export const debounce = <Args extends unknown[]>(fn: (...args: Args) => unknown, delay: number) => {
  let id: number | undefined = undefined
  return (...args: Args): void => {
    if (id) clearTimeout(id)
    id = setTimeout(() => fn(...args), delay)
  }
}

export type PromiseCancelable<T> = Promise<T> & {cancel: () => void}

export const setTimeoutPromise = <Args extends any[], Ret, AbortValue>(
  fn: (...args: Args) => Ret,
  timeout: number,
  abortValue: AbortValue,
  ...args: Args
): PromiseCancelable<Ret> => {
  let timeoutId: number | undefined = undefined
  let cancel = () => {}
  const promise = new Promise<Ret>((resolve, reject) => {
    cancel = () => {
      clearTimeout(timeoutId)
      reject(abortValue)
    }
    timeoutId = setTimeout(() => {
      Promise.resolve()
        .then(() => fn(...args))
        .then((res) => resolve(res))
        .catch((err) => reject(err))
    }, timeout)
  }) as PromiseCancelable<Ret>
  promise.cancel = cancel
  return promise
}

export const debouncePromise = <Args extends any[], Ret, AbortValue>(
  fn: (...args: Args) => Ret,
  timeout: number,
  abortValue: AbortValue
) => {
  let promise = {cancel: () => {}}
  return (...args: Args): PromiseCancelable<Ret> => {
    promise.cancel()
    return (promise = setTimeoutPromise(fn, timeout, abortValue, ...args))
  }
}
