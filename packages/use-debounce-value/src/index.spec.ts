import { renderHook } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest'
import { useDebounceValue } from '.'

beforeAll(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.clearAllTimers()
})

afterAll(() => {
  vi.useRealTimers()
})

test('Should return the original value immediately', () => {
  const { result } = renderHook(() => useDebounceValue('', 1000))

  expect(result.current).toBe('')
})

test('Should returned value should be updated after the delay', () => {
  const { result, rerender } = renderHook((value: string = '') =>
    useDebounceValue(value, 1000),
  )
  rerender('a')
  vi.advanceTimersByTime(999)
  rerender('a')
  expect(result.current).toBe('')
  vi.advanceTimersByTime(1)
  rerender('b')
  expect(result.current).toBe('a')
  vi.advanceTimersByTime(999)
  rerender('b')
  expect(result.current).toBe('a')
  vi.advanceTimersByTime(1)
  rerender('b')
  expect(result.current).toBe('b')
})
