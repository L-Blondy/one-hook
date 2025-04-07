import { act, renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useDocumentVisibility } from '.'

const triggerEvent = () => {
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

test('should be visible initially', () => {
  const { result } = renderHook(() => useDocumentVisibility())
  expect(result.current).toBe(true)
})

test('should trigger onChange when visibility changes', () => {
  const spy = vi.fn()
  renderHook(() => useDocumentVisibility({ onChange: spy }))
  triggerEvent()
  expect(spy).toHaveBeenCalledTimes(1)
  expect(spy).toHaveBeenCalledWith(true)
})
