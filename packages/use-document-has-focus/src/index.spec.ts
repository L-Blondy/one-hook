import { act, renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useDocumentHasFocus } from '.'

const triggerEvent = () => {
  act(() => {
    window.dispatchEvent(new Event('blur'))
  })
}

test('should be true initially', () => {
  const { result } = renderHook(() => useDocumentHasFocus())
  expect(result.current).toBe(document.hasFocus())
})

test('should trigger onChange when visibility changes', () => {
  const spy = vi.fn()
  renderHook(() => useDocumentHasFocus({ onChange: spy }))
  triggerEvent()
  expect(spy).toHaveBeenCalledTimes(1)
})
