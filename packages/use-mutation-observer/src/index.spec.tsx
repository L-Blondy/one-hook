/* eslint-disable react-hooks/refs */
/* eslint-disable react-hooks/immutability */
import { mockMutateTargets } from '../../../test-utils/mutation-observer'
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useMutationObserver } from '.'
import React from 'react'
import { useMergeRefs } from '@1hook/use-merge-refs'
import { scheduler } from 'timers/promises'

afterEach(() => {
  cleanup()
})

test('Should be able to test code located in useEffect', () => {
  let executedAssertions = false

  render(<TestComponent />)
  expect(executedAssertions).toBeTruthy()

  function TestComponent() {
    const { ref } = useMutationObserver(vi.fn())

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
    const observer = useMutationObserver(vi.fn())

    React.useEffect(() => {
      executedAssertions = true
      expect(typeof observer.observe).toBe('function')
      expect(typeof observer.unobserve).toBe('function')
    }, [observer])

    return <div ref={observer.ref} />
  }
})

test('The callback should not be executed if no mutation occurred', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  expect(callbackSpy).not.toHaveBeenCalled()

  function TestComponent() {
    const { ref } = useMutationObserver(callbackSpy)

    return <div ref={ref} />
  }
})

test('The callback should be executed everytime a mutation occurs', () => {
  const callbackSpy1 = vi.fn()
  const callbackSpy2 = vi.fn()

  render(<TestComponent />)
  mockMutateTargets()
  expect(callbackSpy1).toHaveBeenCalledTimes(1)
  expect(callbackSpy2).toHaveBeenCalledTimes(1)
  mockMutateTargets()
  expect(callbackSpy1).toHaveBeenCalledTimes(2)
  expect(callbackSpy2).toHaveBeenCalledTimes(2)

  function TestComponent() {
    const { ref: ref1 } = useMutationObserver(callbackSpy1)
    const { ref: ref2 } = useMutationObserver(callbackSpy2)

    return <div ref={useMergeRefs(ref1, ref2)} />
  }
})

test('The callback should not be executed if the mutation.type does not match top options', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  mockMutateTargets({ type: 'attributes' })
  expect(callbackSpy).toHaveBeenCalledTimes(1)
  mockMutateTargets({ type: 'childList' })
  expect(callbackSpy).toHaveBeenCalledTimes(1)
  mockMutateTargets({ type: 'characterData' })
  expect(callbackSpy).toHaveBeenCalledTimes(1)
  mockMutateTargets({ type: 'attributes' })
  expect(callbackSpy).toHaveBeenCalledTimes(2)

  function TestComponent() {
    const { ref } = useMutationObserver(callbackSpy, {
      attributes: true,
    })

    return <div ref={ref} />
  }
})

test('The callback should receive a single entry and the MutationObserver instance', () => {
  let executedAssertions = false

  render(<TestComponent />)
  mockMutateTargets()
  expect(executedAssertions).toBeTruthy()

  function TestComponent() {
    const { ref } = useMutationObserver((entry, observer) => {
      expectTypeOf(entry).toEqualTypeOf<MutationRecord>()
      expectTypeOf(observer).toEqualTypeOf<MutationObserver>()
      // entry is not an array at runtime
      expect(typeof entry.type).toBe('string')
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
  mockMutateTargets()
  expect(callbackSpy1).toHaveBeenCalledTimes(1)
  expect(callbackSpy2).toHaveBeenCalledTimes(1)

  function TestComponent() {
    const { ref: ref1 } = useMutationObserver(callbackSpy1, {
      attributes: true,
    })
    const { ref: ref2 } = useMutationObserver(callbackSpy2, {
      attributes: true,
    })

    return <div ref={useMergeRefs(ref1, ref2)} />
  }
})

test('{ autoObserve: false } The callback should not be executed', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  mockMutateTargets()
  expect(callbackSpy).not.toHaveBeenCalled()

  function TestComponent() {
    const { ref } = useMutationObserver(callbackSpy, {
      autoObserve: false,
    })

    return <div ref={ref} />
  }
})

test('Should observe after calling `observe()`. Multiple calls have no effect.', async () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  mockMutateTargets()
  expect(callbackSpy).not.toHaveBeenCalled()
  fireEvent.click(screen.getByTestId('observe'))
  fireEvent.click(screen.getByTestId('observe'))
  await scheduler.wait(100)
  fireEvent.click(screen.getByTestId('observe'))
  fireEvent.click(screen.getByTestId('observe'))
  mockMutateTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(1)

  function TestComponent() {
    const { ref, observe } = useMutationObserver(callbackSpy, {
      autoObserve: false,
    })

    return (
      <>
        <div ref={ref} /> <button data-testid="observe" onClick={observe} />
      </>
    )
  }
})

test('The callback should not be executed after calling `unobserve()`', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  mockMutateTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(1)
  mockMutateTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(1)

  function TestComponent() {
    const observer = useMutationObserver(() => {
      callbackSpy()
      observer.unobserve()
    })

    return <div ref={observer.ref} />
  }
})

test('The callback should not be executed if there is no ref', () => {
  const callbackSpy = vi.fn()

  render(<TestComponent />)
  mockMutateTargets()
  expect(callbackSpy).toHaveBeenCalledTimes(0)

  function TestComponent() {
    const observer = useMutationObserver(() => {
      callbackSpy()
      observer.unobserve()
    })

    return <div />
  }
})
