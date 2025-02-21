import { renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useGetIsMounted } from '.'

test('should return a function', () => {
  const { result } = renderHook(() => useGetIsMounted())

  expect(result.current).toBeInstanceOf(Function)
})

test('should return true after mount', () => {
  const { result } = renderHook(() => useGetIsMounted())

  expect(result.current()).toBe(true)
})

test('should return same function on each render', () => {
  const { result, rerender } = renderHook(() => useGetIsMounted())

  const fn1 = result.current
  rerender()
  const fn2 = result.current
  rerender()
  const fn3 = result.current

  expect(fn1).toBe(fn2)
  expect(fn2).toBe(fn3)
})

test('should return false after component unmount', () => {
  const { result, unmount } = renderHook(() => useGetIsMounted())

  expect(result.current()).toBe(true)

  unmount()

  expect(result.current()).toBe(false)
})
