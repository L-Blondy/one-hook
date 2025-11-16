/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/refs */
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useIntersectionObserver } from '.'
import React from 'react'
import { useMergeRefs } from '@1hook/use-merge-refs'
import { mockIntersectTargets } from '../../../test-utils/intersection-observer'
import type { IntersectionObserverInstance } from './vanilla'
import { scheduler } from 'timers/promises'

afterEach(() => {
  cleanup()
})

test('Should be able to test code located in useEffect', () => {
  let executedAssertions = false

  render(<TestComponent />)
  expect(executedAssertions).toBeTruthy()

  function TestComponent() {
    const observer = useIntersectionObserver(vi.fn())

    React.useEffect(() => {
      executedAssertions = true
    }, [observer])

    return <div ref={observer.ref} />
  }
})

test('Hook should return { observe, unobserve }', () => {
  let executedAssertions = false

  render(<TestComponent />)
  expect(executedAssertions).toBeTruthy()

  function TestComponent() {
    const observer = useIntersectionObserver(vi.fn())

    React.useEffect(() => {
      executedAssertions = true
      expect(typeof observer.observe).toBe('function')
      expect(typeof observer.unobserve).toBe('function')
    }, [observer])

    return <div ref={observer.ref} />
  }
})

test('The callback should not be executed if no intersection occurred', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  expect(callbackSpy).not.toHaveBeenCalled()

  function TestComponent() {
    const observer = useIntersectionObserver(callbackSpy)

    return <div ref={observer.ref} />
  }
})

test('The callback should be executed everytime an intersection occurs', () => {
  const callbackSpy1 = vi.fn()
  const callbackSpy2 = vi.fn()

  render(<TestComponent />)
  mockIntersectTargets()
  expect(callbackSpy1).toHaveBeenCalledTimes(1)
  expect(callbackSpy2).toHaveBeenCalledTimes(1)
  mockIntersectTargets()
  expect(callbackSpy1).toHaveBeenCalledTimes(2)
  expect(callbackSpy2).toHaveBeenCalledTimes(2)

  function TestComponent() {
    const observer1 = useIntersectionObserver(callbackSpy1)
    const observer2 = useIntersectionObserver(callbackSpy2)

    return <div ref={useMergeRefs(observer1.ref, observer2.ref)} />
  }
})

test('The callback should receive a single entry and the IntersectionObserverService instance', () => {
  let executedAssertions = false

  render(<TestComponent />)
  mockIntersectTargets()
  expect(executedAssertions).toBeTruthy()

  function TestComponent() {
    const observer = useIntersectionObserver((entry, observer) => {
      expectTypeOf(entry).toEqualTypeOf<IntersectionObserverEntry>()
      expectTypeOf(observer).toEqualTypeOf<IntersectionObserverInstance>()
      // entry is not an array at runtime
      expect(typeof entry.time).toBe('number')
      // observer is not an array at runtime
      expect('root' in observer && 'id' in observer).toBe(true)
      executedAssertions = true
    })

    return <div ref={observer.ref} />
  }
})

test('When 1 target is attached 2 observers with the same options, each callback should be called once per intersection', () => {
  const callbackSpy1 = vi.fn()
  const callbackSpy2 = vi.fn()

  render(<TestComponent />)
  mockIntersectTargets()
  expect(callbackSpy1).toHaveBeenCalledTimes(1)
  expect(callbackSpy2).toHaveBeenCalledTimes(1)

  function TestComponent() {
    const observer1 = useIntersectionObserver(callbackSpy1, {
      threshold: [1],
    })
    const observer2 = useIntersectionObserver(callbackSpy2, {
      threshold: [1],
    })

    return <div ref={useMergeRefs(observer1.ref, observer2.ref)} />
  }
})

test('{ autoObserve: false } the not observe the target by default`', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  mockIntersectTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(0)

  function TestComponent() {
    const observer = useIntersectionObserver(callbackSpy, {
      autoObserve: false,
    })

    return <div ref={observer.ref} />
  }
})

test('`observe()` Should start observing the target. Multiple calls should have no effect.', async () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  mockIntersectTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(0)
  fireEvent.click(screen.getByTestId('observe'))
  fireEvent.click(screen.getByTestId('observe'))
  await scheduler.wait(50)
  fireEvent.click(screen.getByTestId('observe'))
  fireEvent.click(screen.getByTestId('observe'))
  mockIntersectTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(1)

  function TestComponent() {
    const { observe, ref } = useIntersectionObserver(callbackSpy, {
      autoObserve: false,
    })

    return (
      <>
        <div ref={ref} />
        <button data-testid="observe" onClick={observe} />
      </>
    )
  }
})

test('The callback should not be executed after calling `unobserve()`', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  mockIntersectTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(1)
  mockIntersectTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(1)

  function TestComponent() {
    const { unobserve, ref } = useIntersectionObserver(() => {
      callbackSpy()
      unobserve()
    })

    return <div ref={ref} />
  }
})

test('The callback should not be executed if there is no target', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  mockIntersectTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(0)

  function TestComponent() {
    const observer = useIntersectionObserver(() => {
      callbackSpy()
      observer.unobserve()
    })

    return <div />
  }
})

test('The callback should be executed only for the intersecting targets', async () => {
  const callbackSpy1 = vi.fn()
  const callbackSpy2 = vi.fn()

  let target: Element | null = null

  render(<TestComponent />)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!target) throw new Error('target not found')
  mockIntersectTargets({ filter: [target] })
  await scheduler.wait(50)
  expect(callbackSpy1).toHaveBeenCalledTimes(1)
  expect(callbackSpy2).toHaveBeenCalledTimes(0)

  function TestComponent() {
    const { ref } = useIntersectionObserver(callbackSpy1)
    const observer2 = useIntersectionObserver(callbackSpy2)

    return (
      <div>
        <div
          ref={React.useCallback(
            (el: any) => {
              ref(el)
              if (!target && el) {
                target = el
              }
            },
            [ref],
          )}
        />
        <svg ref={observer2.ref} />
      </div>
    )
  }
})

test('IntersectionObserverService should be reused for the same options', () => {
  const callbackSpy1 = vi.fn()
  const callbackSpy2 = vi.fn()
  const callbackSpy3 = vi.fn()

  function TestComponent() {
    const observer1 = useIntersectionObserver(callbackSpy1, {
      threshold: [0, 1],
    })
    const observer2 = useIntersectionObserver(callbackSpy2, {
      threshold: [0, 1],
    })
    const observer3 = useIntersectionObserver(callbackSpy3, {
      threshold: [0, 1],
    })

    return (
      <div>
        <div ref={observer1.ref} />
        <div ref={observer2.ref} />
        <div ref={observer3.ref} />
      </div>
    )
  }
  render(<TestComponent />)
  expect(IntersectionObserver).toHaveBeenCalledTimes(1)
})
