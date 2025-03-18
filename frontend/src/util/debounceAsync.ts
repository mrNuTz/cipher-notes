/* eslint-disable @typescript-eslint/no-explicit-any */

export function debounceAsync<Fn extends (...args: any[]) => Promise<any>>(
  fn: Fn,
  timeout: number
): (...args: Parameters<Fn>) => void {
  let timerId: ReturnType<typeof setTimeout> | null = null
  let running = false
  let pending = false
  let lastArgs: Parameters<Fn>

  async function execute(): Promise<void> {
    running = true
    try {
      await fn(...lastArgs)
    } finally {
      running = false
    }
    if (pending) {
      pending = false
      execute()
    }
  }

  function debounced(...args: Parameters<Fn>): void {
    lastArgs = args
    if (timerId !== null) {
      clearTimeout(timerId)
    }
    timerId = setTimeout(() => {
      timerId = null
      if (!running) {
        execute()
      } else {
        pending = true
      }
    }, timeout)
  }
  return debounced
}
