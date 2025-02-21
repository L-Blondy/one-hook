import {
  afterAll,
  afterEach,
  beforeAll,
  expect,
  expectTypeOf,
  test,
  vi,
} from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useResizeObserver } from '.'
import React from 'react'
import { mockResizeTargets } from 'src/hooks/_test-utils/resize-observer'
import { useMergeRefs } from 'src/hooks/use-merge-refs'

beforeAll(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cleanup()
  vi.clearAllTimers()
})

afterAll(() => {
  vi.useRealTimers()
})

test('Should be able to test code located in useEffect', () => {
  let executedAssertions = false

  render(<TestComponent />)
  expect(executedAssertions).toBeTruthy()

  function TestComponent() {
    const { ref } = useResizeObserver(vi.fn())

    React.useEffect(() => {
      executedAssertions = true
    }, [])

    return <div ref={ref} />
  }
})

test('Hook should return { observe, unobserve }', () => {
  let executedAssertions = false

  render(<TestComponent />)
  expect(executedAssertions).toBeTruthy()

  function TestComponent() {
    const observer = useResizeObserver(vi.fn())

    React.useEffect(() => {
      executedAssertions = true
      expect(typeof observer.observe).toBe('function')
      expect(typeof observer.unobserve).toBe('function')
    }, [observer])

    return <div ref={observer.ref} />
  }
})

test('The callback should be executed even if no resize occurred', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  expect(callbackSpy).toHaveBeenCalledTimes(1)

  function TestComponent() {
    const { ref } = useResizeObserver(callbackSpy)

    return <div ref={ref} />
  }
})

test('The callback should be executed everytime a resize occurs', () => {
  const callbackSpy1 = vi.fn()
  const callbackSpy2 = vi.fn()

  render(<TestComponent />)
  expect(callbackSpy1).toHaveBeenCalledTimes(1)
  expect(callbackSpy2).toHaveBeenCalledTimes(1)
  mockResizeTargets()
  expect(callbackSpy1).toHaveBeenCalledTimes(2)
  expect(callbackSpy2).toHaveBeenCalledTimes(2)
  mockResizeTargets()
  expect(callbackSpy1).toHaveBeenCalledTimes(3)
  expect(callbackSpy2).toHaveBeenCalledTimes(3)

  function TestComponent() {
    const { ref: ref1 } = useResizeObserver(callbackSpy1)
    const { ref: ref2 } = useResizeObserver(callbackSpy2)

    return <div ref={useMergeRefs(ref1, ref2)} />
  }
})

test('The callback should receive a single entry and the ResizeObserver instance', () => {
  let executedAssertions = false

  render(<TestComponent />)
  mockResizeTargets()
  expect(executedAssertions).toBeTruthy()

  function TestComponent() {
    const { ref } = useResizeObserver((entry, observer) => {
      expectTypeOf(entry).toEqualTypeOf<ResizeObserverEntry>()
      expectTypeOf(observer).toEqualTypeOf<ResizeObserver>()
      // entry is not an array at runtime
      expect(typeof entry.contentBoxSize).toBe('object')
      // observer is not an array at runtime
      expect(typeof observer.disconnect).toBe('function')
      executedAssertions = true
    })

    return <div ref={ref} />
  }
})

test('When 1 ref is attached 2 observers with the same options, each callback should be called once per intersection', () => {
  const callbackSpy1 = vi.fn()
  const callbackSpy2 = vi.fn()

  render(<TestComponent />)
  expect(callbackSpy1).toHaveBeenCalledTimes(1)
  expect(callbackSpy2).toHaveBeenCalledTimes(1)
  mockResizeTargets()
  expect(callbackSpy1).toHaveBeenCalledTimes(2)
  expect(callbackSpy2).toHaveBeenCalledTimes(2)

  function TestComponent() {
    const { ref: ref1 } = useResizeObserver(callbackSpy1, {
      box: 'border-box',
    })
    const { ref: ref2 } = useResizeObserver(callbackSpy2, {
      box: 'border-box',
    })

    return <div ref={useMergeRefs(ref1, ref2)} />
  }
})

test('{ autoObserve: false } The callback should not be executed', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  mockResizeTargets()
  expect(callbackSpy).not.toHaveBeenCalled()

  function TestComponent() {
    const { ref } = useResizeObserver(callbackSpy, {
      autoObserve: false,
    })

    return <div ref={ref} />
  }
})

test('Should observe after calling `observe()`. Multiple calls should have no effect.', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  mockResizeTargets()
  expect(callbackSpy).not.toHaveBeenCalled()
  fireEvent.click(screen.getByTestId('observe'))
  fireEvent.click(screen.getByTestId('observe'))
  vi.advanceTimersByTime(100)
  fireEvent.click(screen.getByTestId('observe'))
  fireEvent.click(screen.getByTestId('observe'))
  // leading call
  expect(callbackSpy).toHaveBeenCalledTimes(1)
  mockResizeTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(2)

  function TestComponent() {
    const observer = useResizeObserver(callbackSpy, {
      autoObserve: false,
    })

    return (
      <>
        <div ref={observer.ref} />
        <button data-testid="observe" onClick={observer.observe} />
      </>
    )
  }
})

test('The callback should not be executed after calling `unobserve()`', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  expect(callbackSpy).toHaveBeenCalledTimes(1)
  mockResizeTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(1)
  mockResizeTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(1)

  function TestComponent() {
    const observer = useResizeObserver(() => {
      callbackSpy()
      observer.unobserve()
    })

    return <div ref={observer.ref} />
  }
})

test('The callback should not be executed if there is no ref', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  mockResizeTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(0)

  function TestComponent() {
    const observer = useResizeObserver(() => {
      callbackSpy()
      observer.unobserve()
    })

    return <div />
  }
})
