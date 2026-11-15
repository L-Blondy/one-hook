import { act, renderHook } from '@testing-library/react'
import { beforeEach, expect, expectTypeOf, test, vi } from 'vitest'
import { defineUseWindowSize } from '.'

const triggerResize = (dimension: 'width' | 'height', value: number) => {
  if (dimension === 'width') {
    window.innerWidth = value
  } else {
    window.innerHeight = value
  }

  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

beforeEach(() => {
  window.innerWidth = 100
  window.innerHeight = 100
})

test('type inference', () => {
  type Size = { width: number; height: number }
  renderHook(() => {
    const ws1 = defineUseWindowSize()()
    const ws2 = defineUseWindowSize({ ssr: false })()
    const ws3 = defineUseWindowSize({ ssr: true })()
    expectTypeOf(ws1).toEqualTypeOf<Size>()
    expectTypeOf(ws2).toEqualTypeOf<Size>()
    expectTypeOf(ws3).toEqualTypeOf<Partial<Size>>()

    defineUseWindowSize()({
      onChange(size) {
        expectTypeOf(size).toEqualTypeOf<Size>()
      },
    })
  })
})

test('onChange should fire at least once', () => {
  const useWindowSize = defineUseWindowSize()
  const spy = vi.fn()
  renderHook(() => useWindowSize({ onChange: spy }))

  expect(spy).toHaveBeenCalledWith({ width: 100, height: 100 })
  expect(spy).toHaveBeenCalledTimes(2) // strict mode
})

test('size should update with resize events', () => {
  const useWindowSize = defineUseWindowSize()
  const { result } = renderHook(() => useWindowSize())

  expect(result.current.width).toBe(100)
  expect(result.current.height).toBe(100)

  triggerResize('width', 200)
  expect(result.current.width).toBe(200)
  expect(result.current.height).toBe(100)

  triggerResize('height', 200)
  expect(result.current.width).toBe(200)
  expect(result.current.height).toBe(200)
})

test('Should work with several concurrent hooks', () => {
  const useWindowSize = defineUseWindowSize()
  const { result: r1 } = renderHook(() => useWindowSize())
  const { result: r2 } = renderHook(() => useWindowSize())

  expect(r1.current.width).toBe(100)
  expect(r1.current.height).toBe(100)
  expect(r2.current.width).toBe(100)
  expect(r2.current.height).toBe(100)

  triggerResize('width', 200)
  expect(r1.current.width).toBe(200)
  expect(r1.current.height).toBe(100)
  expect(r2.current.width).toBe(200)
  expect(r2.current.height).toBe(100)
})

test('onChange should be called with resize events', () => {
  const useWindowSize = defineUseWindowSize()
  const spy = vi.fn()
  renderHook(() => useWindowSize({ onChange: spy }))

  triggerResize('width', 200)
  expect(spy).toHaveBeenCalledWith({ width: 200, height: 100 })
})

test('`trackState: false` onChange should trigger, state should not change', () => {
  const useWindowSize = defineUseWindowSize()
  const spy = vi.fn()
  const { result } = renderHook(() =>
    useWindowSize({ trackState: false, onChange: spy }),
  )

  expect(result.current.width).toBe(100)
  triggerResize('width', 200)
  expect(result.current.width).toBe(100)
  expect(spy).toHaveBeenCalledWith({ width: 200, height: 100 })
})

test('`trackState: false` keeps the last tracked size; tracking again shows the current one', () => {
  const useWindowSize = defineUseWindowSize()
  const { result, rerender } = renderHook(
    ({ trackState }) => useWindowSize({ trackState }),
    { initialProps: { trackState: true } },
  )

  triggerResize('width', 200)
  expect(result.current.width).toBe(200)

  rerender({ trackState: false })
  triggerResize('width', 300)
  expect(result.current.width).toBe(200)

  rerender({ trackState: true })
  expect(result.current.width).toBe(300)
})

test('hooks share one object per size, and a resize that keeps the size renders nothing', () => {
  const useWindowSize = defineUseWindowSize()
  let renders = 0
  const { result: r1 } = renderHook(() => {
    renders++
    return useWindowSize()
  })
  const { result: r2 } = renderHook(() => useWindowSize())
  expect(r1.current).toBe(r2.current)

  const rendersBefore = renders
  triggerResize('width', 100) // same size
  expect(renders).toBe(rendersBefore)

  triggerResize('width', 200)
  expect(r1.current).toBe(r2.current)
  expect(r1.current).toEqual({ width: 200, height: 100 })
})

test('the size renders before the next task, not in a deferred transition', async () => {
  const useWindowSize = defineUseWindowSize()
  const { result } = renderHook(() => useWindowSize())

  window.innerWidth = 250
  window.dispatchEvent(new Event('resize'))
  // An urgent update flushes in a microtask; a transition waits for a task.
  await Promise.resolve()
  expect(result.current.width).toBe(250)
})
