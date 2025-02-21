import { renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useRerender } from '.'

test('Should return a function with a stable identity', () => {
  const { result, rerender } = renderHook(useRerender)
  const fn1 = result.current
  expect(typeof fn1).toBe('function')
  rerender()
  const fn2 = result.current
  expect(fn1).toBe(fn2)
})
