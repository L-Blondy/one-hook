import { act, renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useDocumentVisibility } from '.'

const triggerEvent = () => {
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

test('should be true initially', () => {
  const { result } = renderHook(() => useDocumentVisibility())
  expect(result.current).toBe(true)
})

test('should trigger onChange when visibility changes', () => {
  const spy = vi.fn()
  renderHook(() => useDocumentVisibility({ onChange: spy }))
  triggerEvent()
  expect(spy).toHaveBeenCalledTimes(1)
})

test('{ trackState: false } should not rerender when the visibility changes', () => {
  const onChangeSpy = vi.fn()
  let renderCount = 0

  renderHook(() => {
    renderCount++
    return useDocumentVisibility({ trackState: false, onChange: onChangeSpy })
  })

  const initialRenderCount = renderCount

  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => true,
  })
  triggerEvent()
  Reflect.deleteProperty(document, 'hidden')

  expect(onChangeSpy).toHaveBeenCalledWith(false)
  expect(renderCount).toBe(initialRenderCount)
})
