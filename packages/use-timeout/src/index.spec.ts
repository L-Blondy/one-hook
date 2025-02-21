import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  test,
  vi,
} from 'vitest'
import { useTimeout } from '.'
import { renderHook } from '@testing-library/react'

beforeEach(() => {
  vi.spyOn(global, 'setTimeout')
  vi.spyOn(global, 'clearTimeout')
})

beforeAll(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllTimers()
})

afterAll(() => {
  vi.useRealTimers()
})

test('`delay: number` should init hook with custom delay', () => {
  const callback = vi.fn()
  renderHook(() => useTimeout(callback, 5000))

  expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000)
})

test('`delay: null` should init hook without delay', () => {
  const callback = vi.fn()
  renderHook(() => useTimeout(callback, null))

  expect(setTimeout).not.toHaveBeenCalled()
  expect(callback).not.toHaveBeenCalled()
})

test('should execute the callback after the delay', () => {
  const callback = vi.fn()
  renderHook(() => useTimeout(callback, 200))
  expect(callback).not.toHaveBeenCalled()

  // fast-forward time until 1s before it should be executed
  vi.advanceTimersByTime(199)
  expect(callback).not.toHaveBeenCalled()

  // fast-forward until 1st call should be executed
  vi.advanceTimersByTime(1)
  expect(callback).toHaveBeenCalledTimes(1)
})

test('should clear timeout on unmount', () => {
  const callback = vi.fn()
  const { unmount } = renderHook(() => useTimeout(callback, 200))
  unmount()
  expect(clearTimeout).toHaveBeenCalled()
})

test('`cancel()` should clear the timeout', () => {
  const callback = vi.fn()
  const { result } = renderHook(() => useTimeout(callback, 1000))
  result.current.cancel()
  vi.advanceTimersByTime(1000)
  expect(callback).toHaveBeenCalledTimes(0)
})

test('`reset()` should reset the timeout', () => {
  const callback = vi.fn()
  const { result } = renderHook(() => useTimeout(callback, 1000))
  result.current.cancel()
  result.current.reset()
  vi.advanceTimersByTime(1000)
  expect(callback).toHaveBeenCalledTimes(1)
  result.current.reset()
  vi.advanceTimersByTime(500)
  result.current.cancel()
  result.current.reset()
  vi.advanceTimersByTime(500)
  expect(callback).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(500)
  expect(callback).toHaveBeenCalledTimes(2)
})

test('`isPending` should be true when the timeout is scheduled', () => {
  const callback = vi.fn()
  let delay = 1000
  const { result, rerender } = renderHook(() => useTimeout(callback, delay))
  expect(result.current.isPending).toBe(true)
  vi.advanceTimersByTime(1000)
  rerender()
  expect(result.current.isPending).toBe(false)
  delay = 500
  rerender()
  rerender()
  expect(result.current.isPending).toBe(true)
  vi.advanceTimersByTime(500)
  rerender()
  expect(result.current.isPending).toBe(false)
})

test('should handle new timeout when delay is updated', () => {
  const callback = vi.fn()
  let delay = 200
  const { rerender } = renderHook(() => useTimeout(callback, delay))
  expect(callback).not.toHaveBeenCalled()

  vi.advanceTimersByTime(100)
  expect(callback).toHaveBeenCalledTimes(0)
  delay = 50
  rerender()
  vi.advanceTimersByTime(50)
  expect(callback).toHaveBeenCalledTimes(1)
  delay = 100
  rerender()
  vi.advanceTimersByTime(99)
  expect(callback).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  expect(callback).toHaveBeenCalledTimes(2)
})
