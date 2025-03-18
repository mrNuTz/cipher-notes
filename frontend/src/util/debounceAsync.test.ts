/* eslint-disable @typescript-eslint/no-unused-vars */

import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {debounceAsync} from './debounceAsync'

describe('debounceAsync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('calls the function after the timeout when invoked once', async () => {
    const asyncFunc = vi.fn(async (arg: number) => {
      return arg
    })
    const debounced = debounceAsync(asyncFunc, 100)

    debounced(42)
    // Should not call the function immediately.
    expect(asyncFunc).not.toHaveBeenCalled()

    // Advance time to trigger the debounced call.
    vi.advanceTimersByTime(100)
    // Allow pending microtasks to complete.
    await Promise.resolve()

    expect(asyncFunc).toHaveBeenCalledTimes(1)
    expect(asyncFunc).toHaveBeenCalledWith(42)
  })

  it('resets the timeout on successive calls and uses the latest arguments', async () => {
    const asyncFunc = vi.fn(async (arg: string) => arg)
    const debounced = debounceAsync(asyncFunc, 100)

    debounced('first')
    vi.advanceTimersByTime(50)
    debounced('second')
    // At 50ms after first call, timer is reset; function should not run yet.
    expect(asyncFunc).not.toHaveBeenCalled()

    // Advance 100ms from the last call.
    vi.advanceTimersByTime(100)
    await Promise.resolve()

    expect(asyncFunc).toHaveBeenCalledTimes(1)
    expect(asyncFunc).toHaveBeenCalledWith('second')
  })

  it('schedules a trailing call if called while async function is running', async () => {
    // Create a controllable async function.
    let resolveFirst: ((value?: unknown) => void) | null = null
    const asyncFunc = vi.fn((arg: number) => {
      return new Promise((resolve) => {
        if (!resolveFirst) {
          resolveFirst = resolve
        } else {
          // For trailing call, resolve immediately.
          resolve(arg)
        }
      })
    })
    const debounced = debounceAsync(asyncFunc, 100)

    // First call: schedule and then trigger execution.
    debounced(1)
    vi.advanceTimersByTime(100)
    await Promise.resolve()
    expect(asyncFunc).toHaveBeenCalledTimes(1)
    expect(asyncFunc).toHaveBeenCalledWith(1)

    // While first execution is still running, invoke the debounced function again.
    debounced(2)
    // Function should not be called immediately because the first call is still in progress.
    expect(asyncFunc).toHaveBeenCalledTimes(1)

    // Complete the first execution.
    resolveFirst!(undefined)
    await Promise.resolve()
    vi.advanceTimersByTime(100)
    await Promise.resolve()

    expect(asyncFunc).toHaveBeenCalledTimes(2) // the test fails here with 1 instead of 2
    // The trailing call should use the latest argument.
    expect(asyncFunc.mock.calls[1]?.[0]).toBe(2)
  })

  it('ensures no parallel executions occur', async () => {
    let runningCount = 0
    const asyncFunc = vi.fn(async (arg: number) => {
      runningCount++
      // Simulate async work.
      await new Promise((resolve) => setTimeout(resolve, 200))
      runningCount--
      return arg
    })
    const debounced = debounceAsync(asyncFunc, 100)

    debounced(10)
    vi.advanceTimersByTime(100)
    await Promise.resolve() // first execution starts.
    expect(runningCount).toBe(1)

    debounced(20)
    vi.advanceTimersByTime(100) // triggers trailing logic; pending is set.
    expect(runningCount).toBe(1)

    // Advance to when the first async call should finish (t=300)
    vi.advanceTimersByTime(100)
    await Promise.resolve()
    // Now, advance the extra 1ms to trigger the trailing call.
    vi.advanceTimersByTime(10)
    await Promise.resolve()
    // Now the trailing call should have started:
    expect(runningCount).toBe(1) // Fails here with 0 instead of 1

    // Later, after letting the trailing call finish:
    vi.advanceTimersByTime(200)
    await Promise.resolve()
    expect(runningCount).toBe(0)
    expect(asyncFunc).toHaveBeenCalledTimes(2)
  })

  it('uses the latest arguments when multiple calls occur during running state', async () => {
    let resolveCall: ((value?: unknown) => void) | null = null
    const asyncFunc = vi.fn((_arg: string) => {
      return new Promise((resolve) => {
        resolveCall = resolve
      })
    })
    const debounced = debounceAsync(asyncFunc, 100)

    // First invocation.
    debounced('first')
    vi.advanceTimersByTime(100)
    await Promise.resolve()
    expect(asyncFunc).toHaveBeenCalledWith('first')

    // While the first call is running, issue multiple calls.
    debounced('second')
    vi.advanceTimersByTime(50)
    debounced('third')
    vi.advanceTimersByTime(50)
    // Function should still be running from the first call.
    expect(asyncFunc).toHaveBeenCalledTimes(1)

    // Finish the first call.
    resolveCall!(undefined)
    // Advance time to trigger trailing call.
    vi.advanceTimersByTime(100)
    await Promise.resolve()

    expect(asyncFunc).toHaveBeenCalledTimes(2)
    // The trailing call should receive the latest argument ("third").
    expect(asyncFunc.mock.calls[1]?.[0]).toBe('third')
  })
})
