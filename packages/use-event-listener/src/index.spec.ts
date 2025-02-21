import { afterEach, expect, expectTypeOf, test, vi } from 'vitest'
import { useEventListener } from '.'
import { fireEvent, renderHook } from '@testing-library/react'
import { clearEventListeners } from './test-utils'
import { instanceMap } from './vanilla'
import { timeout } from 'src/utils'
import React from 'react'

afterEach(() => {
  clearEventListeners()
  vi.restoreAllMocks()
  vi.clearAllTimers()
})

test('type inferrence', () => {
  const { result } = renderHook(() =>
    useEventListener(
      window,
      'DOMContentLoaded',
      (e) => {
        expectTypeOf(e).toEqualTypeOf<Event>()
      },
      {
        capture: true,
        once: true,
        passive: true,
      },
    ),
  )
  expectTypeOf(result.current.remove).toEqualTypeOf<() => void>()

  renderHook(() =>
    useEventListener(
      document,
      'DOMContentLoaded',
      (e) => {
        expectTypeOf(e).toEqualTypeOf<Event>()
      },
      {
        capture: true,
        once: true,
        passive: true,
      },
    ),
  )

  renderHook(() =>
    useEventListener(
      document.querySelector('input'),
      // @ts-expect-error invalid event
      'DOMContentLoaded',
      (_) => {},
      {
        capture: true,
        once: true,
        passive: true,
      },
    ),
  )

  renderHook(() =>
    useEventListener(
      document.querySelector('input'),
      // @ts-expect-error invalid event
      'DOMContentLoaded',
      (_) => {},
      {
        capture: true,
        once: true,
        passive: true,
      },
    ),
  )

  renderHook(() => {
    const ref = React.useRef<Window | null>(null)
    useEventListener(ref, 'DOMContentLoaded', (_) => {}, {
      capture: true,
      once: true,
      passive: true,
    })
  })

  renderHook(() => {
    const ref = React.useRef<HTMLInputElement | null>(null)
    useEventListener(ref, 'input', (_) => {}, {
      capture: true,
      once: true,
      passive: true,
    })
  })

  renderHook(() =>
    useEventListener(document.querySelector('input'), 'change', (_) => {}, {
      capture: true,
      once: true,
      passive: true,
    }),
  )
})

test('Should listen to the events', () => {
  const spy = vi.fn()
  renderHook(() => useEventListener(window, 'click', spy))
  expect(spy).toHaveBeenCalledTimes(0)
  fireEvent.click(window)
  expect(spy).toHaveBeenCalledTimes(1)
})

test('Should remove the listener on unmount', () => {
  vi.spyOn(window, 'removeEventListener')
  const { unmount } = renderHook(() =>
    useEventListener(window, 'click', vi.fn()),
  )
  expect(removeEventListener).toHaveBeenCalledTimes(1) // StrictMode
  unmount()
  expect(removeEventListener).toHaveBeenCalledTimes(2)
})

test('If several hooks are called with the same `target`, `type`, `options`, the listener should be added only once', () => {
  vi.spyOn(window, 'addEventListener')
  renderHook(() =>
    useEventListener(window, 'input', vi.fn(), { capture: true }),
  )
  renderHook(() =>
    useEventListener(window, 'input', vi.fn(), { capture: true }),
  )

  // twice because of strict mode (add => remove => add)
  // without reusing the instance the count would be 4
  expect(addEventListener).toHaveBeenCalledTimes(2)
})

test('The callback should not execute after calling `remove`', () => {
  const spy = vi.fn()

  const { result } = renderHook(() => useEventListener(window, 'click', spy))
  fireEvent.click(window)
  expect(spy).toHaveBeenCalledTimes(1)
  result.current.remove()
  fireEvent.click(window)
  expect(spy).toHaveBeenCalledTimes(1)
})

test('{ manual: true } Should not listen by default', () => {
  const spy = vi.fn()

  renderHook(() => useEventListener(window, 'click', spy, { manual: true }))
  fireEvent.click(window)
  expect(spy).toHaveBeenCalledTimes(0)
})

test('Should listen after calling add()', () => {
  const spy = vi.fn()

  const { result } = renderHook(() =>
    useEventListener(window, 'click', spy, { manual: true }),
  )
  fireEvent.click(window)
  expect(spy).toHaveBeenCalledTimes(0)
  result.current.add()
  fireEvent.click(window)
  expect(spy).toHaveBeenCalledTimes(1)
})

test('Calling add() multiple times should change nothing', async () => {
  const spy = vi.fn()

  const { result } = renderHook(() =>
    useEventListener(window, 'click', spy, { manual: true }),
  )
  fireEvent.click(window)
  expect(spy).toHaveBeenCalledTimes(0)
  result.current.add()
  result.current.add()
  result.current.add()
  await timeout(100)
  result.current.add()
  result.current.add()
  result.current.add()
  fireEvent.click(window)
  expect(spy).toHaveBeenCalledTimes(1)
})

test('Should stop listening after calling remove()', () => {
  const spy = vi.fn()

  const { result } = renderHook(() =>
    useEventListener(window, 'click', spy, { manual: true }),
  )
  fireEvent.click(window)
  expect(spy).toHaveBeenCalledTimes(0)
  result.current.add()
  fireEvent.click(window)
  expect(spy).toHaveBeenCalledTimes(1)
  result.current.remove()
  fireEvent.click(window)
  expect(spy).toHaveBeenCalledTimes(1)
})

test('{ once: true } should trigger once for every listener', () => {
  const spy1 = vi.fn()
  const spy2 = vi.fn()

  renderHook(() => useEventListener(window, 'click', spy1, { once: true }))
  const { result: result2 } = renderHook(() =>
    useEventListener(window, 'click', spy2, { once: true, manual: true }),
  )
  fireEvent.click(window)
  expect(spy1).toHaveBeenCalledTimes(1)
  expect(spy2).toHaveBeenCalledTimes(0)
  result2.current.add()
  fireEvent.click(window)
  expect(spy1).toHaveBeenCalledTimes(1)
  expect(spy2).toHaveBeenCalledTimes(1)
})

test('MEMORY TEST: the `instanceMap` should be empty after removal', () => {
  const hook1 = renderHook(() => useEventListener(window, 'click', vi.fn()))
  const hook2 = renderHook(() => useEventListener(document, 'click', vi.fn()))
  expect(instanceMap.size).toBe(2)
  hook1.result.current.remove()
  expect(instanceMap.size).toBe(1)
  hook2.unmount()
  expect(instanceMap.size).toBe(0)
})
