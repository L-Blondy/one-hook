import { renderHook } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'
import { useDebounceFn } from '.'

beforeAll(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.clearAllTimers()
})

afterAll(() => {
  vi.useRealTimers()
})

test('The last `debounce` call should be executed after the delay', () => {
  const spy = vi.fn()

  const { result } = renderHook(() => useDebounceFn(1000))
  result.current.debounce(spy)
  vi.advanceTimersByTime(999)
  expect(spy).not.toHaveBeenCalled()
  result.current.debounce(spy)
  vi.advanceTimersByTime(999)
  expect(spy).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(spy).toHaveBeenCalledOnce()
})

test('The default delay can be overriden in the function call', () => {
  const spy = vi.fn()

  const { result } = renderHook(() => useDebounceFn(1000))
  result.current.debounce(spy, 500)
  vi.advanceTimersByTime(499)
  expect(spy).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(spy).toHaveBeenCalledOnce()
})

test('`debounce` should not be executed if the hook unmounts', () => {
  const spy = vi.fn()

  const { result, unmount } = renderHook(() => useDebounceFn(100))
  result.current.debounce(spy)
  unmount()
  vi.advanceTimersByTime(100)
  expect(spy).not.toHaveBeenCalled()
})

test('`cancel` should cancel the `debounce` execution', () => {
  const spy = vi.fn()

  const { result } = renderHook(() => useDebounceFn(100))
  result.current.debounce(spy)
  vi.advanceTimersByTime(99)
  expect(spy).not.toHaveBeenCalled()
  result.current.debounce(spy)
  vi.advanceTimersByTime(99)
  expect(spy).not.toHaveBeenCalled()
  result.current.cancel()
  vi.advanceTimersByTime(1)
  expect(spy).not.toHaveBeenCalled()
})

test('`isPending` should be true while debouncing', () => {
  const spy = vi.fn()

  const { result, rerender } = renderHook(() => useDebounceFn(1000))
  expect(result.current.isPending).toBe(false)
  result.current.debounce(spy)
  rerender()
  expect(result.current.isPending).toBe(true)
  vi.advanceTimersByTime(999)
  rerender()
  expect(result.current.isPending).toBe(true)
  vi.advanceTimersByTime(1)
  rerender()
  expect(result.current.isPending).toBe(false)
})

test('`isPending` should become false when cancelling', () => {
  const spy = vi.fn()

  const { result, rerender } = renderHook(() => useDebounceFn(1000))
  expect(result.current.isPending).toBe(false)
  result.current.debounce(spy)
  rerender()
  expect(result.current.isPending).toBe(true)
  result.current.cancel()
  rerender()
  expect(result.current.isPending).toBe(false)
})

test('`Should be called synchronously if `delay: 0', () => {
  let value = 0
  const spy = vi.fn(() => ++value)

  const { result } = renderHook(useDebounceFn)
  expect(result.current.isPending).toBe(false)
  result.current.debounce(spy, 0)
  expect(value).toBe(1)
})
