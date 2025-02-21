import React from 'react'
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'
import { useInterval } from '.'
import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import { resetIntervalSync } from './test-utils'

beforeAll(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  resetIntervalSync()
  vi.restoreAllMocks()
  vi.clearAllTimers()
})

afterAll(() => {
  vi.useRealTimers()
})

test('`delay: number, leading: true` should call the callback immediately', () => {
  const callback = vi.fn()
  renderHook(() => useInterval(callback, 5000, { leading: true }))
  expect(callback).toHaveBeenCalled()
})

test('`delay: null` should init hook without delay', () => {
  const callback = vi.fn()
  renderHook(() => useInterval(callback, null))

  expect(callback).not.toHaveBeenCalled()
})

test('`delay: null, leading: true` should never call the callback', () => {
  const callback = vi.fn()
  renderHook(() => useInterval(callback, null, { leading: true }))

  expect(callback).not.toHaveBeenCalled()
  vi.advanceTimersByTime(10000)
  expect(callback).not.toHaveBeenCalled()
})

test('should repeatedly call provided callback with a fixed time delay between each call', () => {
  const callback = vi.fn()
  renderHook(() => useInterval(callback, 200))
  expect(callback).not.toHaveBeenCalled()

  // fast-forward time until 1s before it should be executed
  vi.advanceTimersByTime(199)
  expect(callback).not.toHaveBeenCalled()

  // fast-forward until 1st call should be executed
  vi.advanceTimersByTime(1)
  expect(callback).toHaveBeenCalledTimes(1)

  // fast-forward until next timer should be executed
  vi.advanceTimersToNextTimer()
  expect(callback).toHaveBeenCalledTimes(2)

  // fast-forward until 3 more timers should be executed
  vi.advanceTimersToNextTimer()
  vi.advanceTimersToNextTimer()
  vi.advanceTimersToNextTimer()
  expect(callback).toHaveBeenCalledTimes(5)
})

test('`cancel()` should clear the interval', () => {
  const callback = vi.fn()
  const { result } = renderHook(() => useInterval(callback, 1000))
  result.current.cancel()
  vi.advanceTimersByTime(1000)
  expect(callback).toHaveBeenCalledTimes(0)
})

test('should clear interval on unmount', () => {
  vi.spyOn(global, 'clearInterval')
  const callback = vi.fn()
  const { unmount } = renderHook(() => useInterval(callback, 200))
  unmount()
  expect(clearInterval).toHaveBeenCalled()
})

test('should handle new interval when delay is updated', () => {
  const callback = vi.fn()
  let delay = 200
  const { rerender } = renderHook(() => useInterval(callback, delay))
  expect(callback).not.toHaveBeenCalled()

  // fast-forward initial delay
  vi.advanceTimersByTime(200)
  expect(callback).toHaveBeenCalledTimes(1)

  // update delay by increasing previous one
  delay = 500
  rerender()

  // fast-forward initial delay again but this time it should not execute the cb
  vi.advanceTimersByTime(200)
  expect(callback).toHaveBeenCalledTimes(1)

  // fast-forward remaining time for new delay
  vi.advanceTimersByTime(300)
  expect(callback).toHaveBeenCalledTimes(2)
})

test('should clear pending interval when delay is updated', () => {
  vi.spyOn(global, 'clearInterval')
  const callback = vi.fn()
  let delay = 200
  const { rerender } = renderHook(() => useInterval(callback, delay))
  // update delay while there is a pending interval
  delay = 500
  rerender()
  expect(clearInterval).toHaveBeenCalled()
})

test('{ sync: true } callbacks should be in sync', () => {
  const spy1 = vi.fn()
  const spy2 = vi.fn()
  function Int1() {
    useInterval(spy1, 1000, { sync: true })
    return <div data-testid="int1" />
  }
  function Int2() {
    useInterval(spy2, 1000, { sync: true })
    return <div data-testid="int2" />
  }
  function TestComponent() {
    const [isMounted, setIsMounted] = React.useState(false)

    return (
      <div>
        <button data-testid="show-int2" onClick={() => setIsMounted(true)}>
          Show Int2
        </button>
        <Int1 />
        {!!isMounted && <Int2 />}
      </div>
    )
  }
  render(<TestComponent />)
  // the interval should have started
  expect(spy1).toHaveBeenCalledTimes(0)
  expect(spy2).toHaveBeenCalledTimes(0)
  // wait 500ms before mounting the 2nd interval
  vi.advanceTimersByTime(500)
  fireEvent.click(screen.getByTestId('show-int2'))
  screen.getByTestId('int2')
  expect(spy1).toHaveBeenCalledTimes(0)
  expect(spy2).toHaveBeenCalledTimes(0)
  // wait another 500ms, both intervals should be called now
  vi.advanceTimersByTime(500)
  expect(spy1).toHaveBeenCalledTimes(1)
  expect(spy2).toHaveBeenCalledTimes(1)
})
