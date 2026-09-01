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

test('should resync the state when `trackState` becomes `true`', () => {
  const { result, rerender } = renderHook(
    ({ trackState }: { trackState: boolean }) =>
      useDocumentVisibility({ trackState }),
    { initialProps: { trackState: false } },
  )

  expect(result.current).toBe(true)

  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => true,
  })
  triggerEvent()

  // the state is stale while `trackState` is `false`
  expect(result.current).toBe(true)

  act(() => {
    rerender({ trackState: true })
  })
  expect(result.current).toBe(false)

  Reflect.deleteProperty(document, 'hidden')
})
