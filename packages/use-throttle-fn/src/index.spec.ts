import { renderHook } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'
import { useThrottleFn } from '.'

beforeAll(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.clearAllTimers()
})

afterAll(() => {
  vi.useRealTimers()
})

test('Should execute immediately', () => {
  const spy = vi.fn()

  const { result } = renderHook(() => useThrottleFn(1000))
  result.current.throttle(spy)
  expect(spy).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(999)
  expect(spy).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  // the function has been called once,
  // since it already has been executed
  // it should not re-execute after the interval
  expect(spy).toHaveBeenCalledTimes(1)
})

test('The interval of the last call should override the others', () => {
  const spy = vi.fn()

  const { result } = renderHook(() => useThrottleFn(1000))
  result.current.throttle(spy, 500)
  result.current.throttle(spy, 750)
  result.current.throttle(spy, 1000)
  expect(spy).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(999)
  expect(spy).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  expect(spy).toHaveBeenCalledTimes(2)
})

test('Should execute at most once after the interval', () => {
  const spy = vi.fn()

  const { result } = renderHook(() => useThrottleFn(1000))
  result.current.throttle(spy)
  result.current.throttle(spy)
  result.current.throttle(spy)
  expect(spy).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(999)
  expect(spy).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  expect(spy).toHaveBeenCalledTimes(2)
})

test('{ trailing: false } should not schedule any execution', () => {
  const spy = vi.fn()

  const { result } = renderHook(() => useThrottleFn(1000, { trailing: false }))
  result.current.throttle(spy)
  result.current.throttle(spy)
  result.current.throttle(spy)
  expect(spy).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(999)
  expect(spy).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  expect(spy).toHaveBeenCalledTimes(1)
})

test('Once the interval has elapsed, the function can be executed synchronously at any time', () => {
  const spy = vi.fn()

  const { result } = renderHook(() => useThrottleFn(1000))
  result.current.throttle(spy)
  result.current.throttle(spy)
  expect(spy).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(999)
  expect(spy).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  expect(spy).toHaveBeenCalledTimes(2)
  result.current.throttle(spy)
  expect(spy).toHaveBeenCalledTimes(2)
  vi.advanceTimersByTime(1000)
  expect(spy).toHaveBeenCalledTimes(3)
  result.current.throttle(spy)
  expect(spy).toHaveBeenCalledTimes(3)
  vi.advanceTimersByTime(1000)
  expect(spy).toHaveBeenCalledTimes(4)
  vi.advanceTimersByTime(1500)
  result.current.throttle(spy)
  expect(spy).toHaveBeenCalledTimes(5)
  result.current.throttle(spy)
  expect(spy).toHaveBeenCalledTimes(5)
})

test('The scheduled throttle should not be executed if the hook unmounts', () => {
  const spy = vi.fn()

  const { result, unmount } = renderHook(() => useThrottleFn(1000))
  result.current.throttle(spy)
  expect(spy).toHaveBeenCalledTimes(1)
  unmount()
  vi.advanceTimersByTime(1000)
  expect(spy).toHaveBeenCalledTimes(1)
})

test('`cancel` should cancel the execution', () => {
  const spy = vi.fn()

  const { result } = renderHook(() => useThrottleFn(1000))
  result.current.throttle(spy)
  result.current.throttle(spy)
  result.current.cancel()
  vi.advanceTimersByTime(1000)
  expect(spy).toHaveBeenCalledTimes(1)
})

test('`isPending` should be true while an execution is scheduled', () => {
  const spy = vi.fn()

  const { result, rerender } = renderHook(() => useThrottleFn(1000))
  expect(result.current.isPending).toBe(false)
  result.current.throttle(spy)
  result.current.throttle(spy)
  rerender()
  expect(result.current.isPending).toBe(true)
  vi.advanceTimersByTime(999)
  rerender()
  expect(result.current.isPending).toBe(true)
  vi.advanceTimersByTime(1)
  rerender()
  expect(result.current.isPending).toBe(false)
})

test('`isPending` should be false after `cancel` is called', () => {
  const spy = vi.fn()

  const { result, rerender } = renderHook(() => useThrottleFn(1000))
  expect(result.current.isPending).toBe(false)
  result.current.throttle(spy)
  result.current.throttle(spy)
  rerender()
  expect(result.current.isPending).toBe(true)
  vi.advanceTimersByTime(500)
  rerender()
  expect(result.current.isPending).toBe(true)
  result.current.cancel()
  rerender()
  expect(result.current.isPending).toBe(false)
})

test('`Should be always called synchronously if `interval: 0', () => {
  const spy = vi.fn()

  const { result } = renderHook(() => useThrottleFn(0))
  expect(result.current.isPending).toBe(false)
  result.current.throttle(spy)
  result.current.throttle(spy, 0)
  result.current.throttle(spy)
  expect(spy).toHaveBeenCalledTimes(3)
})
