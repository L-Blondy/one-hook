import { renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useUnmountEffect } from '.'

test('Executes when unmounting', () => {
  const spy = vi.fn()
  const { unmount } = renderHook(() => useUnmountEffect(spy))
  // strict mode, otherwise 0
  expect(spy).toHaveBeenCalledTimes(1)
  unmount()
  expect(spy).toHaveBeenCalledTimes(2)
})
