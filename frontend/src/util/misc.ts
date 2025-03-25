import {JsonRoot} from './type'

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
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b)
  }
  return a < b ? -1 : a > b ? 1 : 0
}

export const sort = <T>(arr: Array<T>, cmp: (a: T, b: T) => number = compare) =>
  arr.slice().sort(cmp)

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
  let id: ReturnType<typeof setTimeout> | undefined = undefined
  return (...args: Args): void => {
    if (id) clearTimeout(id)
    id = setTimeout(() => fn(...args), delay)
  }
}

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export type PromiseCancelable<T> = Promise<T> & {cancel: () => void}

export const setTimeoutPromise = <Fn extends (...args: any[]) => any, AbortValue>(
  fn: Fn,
  timeout: number,
  abortValue: AbortValue,
  ...args: Parameters<Fn>
): PromiseCancelable<Awaited<ReturnType<Fn>>> => {
  type Ret = Awaited<ReturnType<Fn>>
  let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined
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

export const debouncePromise = <Fn extends (...args: any[]) => any, AbortValue>(
  fn: Fn,
  timeout: number,
  abortValue: AbortValue
) => {
  type Ret = Awaited<ReturnType<Fn>>
  let promise = {cancel: () => {}}
  return (...args: Parameters<Fn>): PromiseCancelable<Ret> => {
    promise.cancel()
    return (promise = setTimeoutPromise(fn, timeout, abortValue, ...args))
  }
}

export const getUniqueBy = <T>(array: T[], getKey: (el: T) => string) => {
  return array.reduce(uniqueByReducer<T>(getKey), [] as T[])
}

const uniqueByReducer = <T>(getKey: (el: T) => string) => {
  const set = new Set<string>()
  return (prev: T[], curr: T) => {
    const key = getKey(curr)
    if (set.has(key)) {
      return prev
    }
    set.add(key)
    prev.push(curr)
    return prev
  }
}

export function log<T>(x: T): T {
  console.debug(x)
  return x
}

/**
 * Calls {fn} immediately when the returned function is called, after that at most once per {timeout}.
 */
export const throttle = <Args extends any[]>(fn: (...args: Args) => unknown, timeout: number) => {
  let pending = false
  let waiting = false
  let lastArgs: Args
  const wait = () =>
    delay(timeout).then(() => {
      if (pending) {
        pending = false
        fn(...lastArgs)
        wait()
      } else {
        waiting = false
      }
    })
  return (...args: Args) => {
    lastArgs = args
    if (pending) return
    if (waiting) {
      pending = true
      return
    }
    waiting = true
    Promise.resolve().then(() => fn(...args))
    wait()
  }
}

export const getWordBounds = (text: string, pos: number): {start: number; end: number} => {
  if (!text) return {start: 0, end: 0}
  if (pos < 0) pos = 0
  if (pos > text.length) pos = text.length

  let end = pos
  while (end < text.length && ![' ', '\t', '\n'].includes(text[end]!)) end++

  let start = pos
  while (start > 0 && ![' ', '\t', '\n'].includes(text[start - 1]!)) start--
  return {start, end}
}
export const spliceString = (str: string, start: number, end: number, insert: string) =>
  str.slice(0, start) + insert + str.slice(end)

export const indexBy = <T, K extends string>(arr: T[], keyFn: (item: T) => K) => {
  const map = {} as Record<K, T>
  for (const item of arr) {
    map[keyFn(item)] = item
  }
  return map
}

export const downloadJson = (data: JsonRoot, filename = 'data.json') => {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], {type: 'application/json'})
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()

  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const formatDateTime = (date: string | number) => new Date(date).toLocaleString()

export const uuidV4WithoutCrypto = () => {
  // it needs to fit the exact format of a uuid v4 and be random
  const hex = '0123456789abcdef'
  let uuid = ''
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-'
    } else if (i === 14) {
      uuid += '4' // Version 4 UUID always has a 4 here
    } else if (i === 19) {
      uuid += hex[(Math.random() * 4) | 8] // 8-11 for variant 1
    } else {
      uuid += hex[Math.floor(Math.random() * 16)]
    }
  }
  return uuid
}

export const safeJsonParse = (str: string): unknown => {
  try {
    return JSON.parse(str)
  } catch (err) {
    return undefined
  }
}

/**
 * Value types are compared with ===.
 * For Objects and Arrays the properties are compared with ===.
 * deepEquals({ 0: 'a', 1: 'b' }, [ 'a', 'b' ]) returns true
 */
export const deepEquals = (
  a: unknown,
  b: unknown,
  ignoreProps: string[] = [],
  prop: string | null = null
): boolean => {
  if (prop !== null && ignoreProps.includes(prop)) return true
  if (typeof a !== typeof b) return false
  if (
    a === undefined ||
    b === undefined ||
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  ) {
    return a === b
  }
  const ak = Object.keys(a)
  const bk = Object.keys(b)
  if (ak.length !== bk.length) return false
  return ak.every((k) => deepEquals((a as any)[k], (b as any)[k], ignoreProps, k))
}

export const truncateWithEllipsis = (txt: string, maxLines = 5, maxChars = 200) => {
  const lines = txt.split('\n')
  let ellipsis: boolean = false
  if (lines.length > maxLines) {
    txt = lines.slice(0, maxLines).join('\n')
    ellipsis = true
  }
  if (txt.length > maxChars) {
    txt = txt.slice(0, maxChars)
    ellipsis = true
  }
  if (ellipsis) {
    txt += '...'
  }
  return txt
}

export const nonConcurrent = (fn: () => Promise<void>): (() => void) => {
  let running = false
  let pending = false

  async function execute() {
    if (running) {
      pending = true
      return
    }
    running = true
    try {
      await fn()
    } finally {
      running = false
    }
    if (pending) {
      pending = false
      execute()
    }
  }
  return () => {
    execute()
  }
}
