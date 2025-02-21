import { renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useUpdateEffect } from '.'

test('Should not execute on mount', () => {
  const spy = vi.fn()
  let dep = 0

  const { rerender } = renderHook(() => {
    useUpdateEffect(spy, [dep])
  })
  expect(spy).toHaveBeenCalledTimes(0)
  rerender()
  expect(spy).toHaveBeenCalledTimes(0)
})

test('Should execute when deps change', () => {
  const spy = vi.fn()
  let dep = 0

  const { rerender } = renderHook(() => {
    useUpdateEffect(spy, [dep])
  })
  expect(spy).toHaveBeenCalledTimes(0)
  dep = 1
  rerender()
  expect(spy).toHaveBeenCalledTimes(1)
})
