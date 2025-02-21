import { renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useMountEffect } from '.'

test('Executes immediately', () => {
  const spy = vi.fn()
  renderHook(() => useMountEffect(spy))
  // strict mode, otherwise 1
  expect(spy).toHaveBeenCalledTimes(2)
})
