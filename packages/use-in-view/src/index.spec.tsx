import { expect, test, afterEach, vi } from 'vitest'
import { cleanup, render, renderHook, screen } from '@testing-library/react'
import { useInView } from '.'
import React from 'react'
import { mockIntersectTargets } from '../../../test-utils/intersection-observer'

afterEach(() => {
  cleanup()
})

test('Should be able to test code located in useEffect', () => {
  let executedAssertions = false

  render(<TestComponent />)
  expect(executedAssertions).toBeTruthy()

  function TestComponent() {
    const observer = useInView()

    React.useEffect(() => {
      executedAssertions = true
    }, [observer])

    return <div ref={observer.ref} />
  }
})

test('Should return { ref, inView }', () => {
  render(<TestComponent />)

  function TestComponent() {
    const observer = useInView()

    React.useEffect(() => {
      expect(typeof observer.ref).toBe('function')
      expect(typeof observer.inView).toBe('undefined')
    }, [observer])

    return <div ref={observer.ref} />
  }
})

test('`inView` should be undefined by default', () => {
  const { result } = renderHook(useInView)

  expect(result.current.inView).toBe(undefined)
})

test('inView should update properly', () => {
  render(<TestComponent />)

  screen.getByText('false')
  mockIntersectTargets({ isIntersecting: true })
  screen.getByText('true')
  mockIntersectTargets({ isIntersecting: false })
  screen.getByText('false')

  function TestComponent() {
    const observer = useInView()
    return <div ref={observer.ref}>{String(observer.inView ?? false)}</div>
  }
})

test('inView should never change if { trackState: false }', () => {
  render(<TestComponent />)

  screen.getByText('false')
  mockIntersectTargets({ isIntersecting: true })
  screen.getByText('false')
  mockIntersectTargets({ isIntersecting: false })
  screen.getByText('false')

  function TestComponent() {
    const observer = useInView({ trackState: false })
    return <div ref={observer.ref}>{String(observer.inView ?? false)}</div>
  }
})

test('onChange should not be called if the target intersection does not change', () => {
  const onChangeSpy = vi.fn()

  render(<TestComponent />)

  expect(onChangeSpy).toHaveBeenCalledTimes(0)

  function TestComponent() {
    const observer = useInView({
      trackState: false,
      onChange: onChangeSpy,
    })
    return <div ref={observer.ref}>{String(observer.inView)}</div>
  }
})

test('{ trackState: false } onChange should be called everyTime the target intersection changes', () => {
  const onChangeSpy = vi.fn()

  render(<TestComponent />)

  expect(onChangeSpy).toHaveBeenCalledTimes(0)
  mockIntersectTargets({ isIntersecting: true })
  expect(onChangeSpy).toHaveBeenCalledTimes(1)
  mockIntersectTargets({ isIntersecting: false })
  expect(onChangeSpy).toHaveBeenCalledTimes(2)
  mockIntersectTargets({ isIntersecting: false })
  expect(onChangeSpy).toHaveBeenCalledTimes(2)
  mockIntersectTargets({ isIntersecting: true })
  expect(onChangeSpy).toHaveBeenCalledTimes(3)

  function TestComponent() {
    const { ref, inView = true } = useInView({
      trackState: false,
      onChange: onChangeSpy,
    })
    return <div ref={ref}>{String(inView)}</div>
  }
})

test('{ trackState: true } onChange should be called everyTime the target is intersecting changes', () => {
  const onChangeSpy = vi.fn()

  render(<TestComponent />)

  expect(onChangeSpy).toHaveBeenCalledTimes(0)
  mockIntersectTargets({ isIntersecting: true })
  expect(onChangeSpy).toHaveBeenCalledTimes(1)
  mockIntersectTargets({ isIntersecting: false })
  expect(onChangeSpy).toHaveBeenCalledTimes(2)
  mockIntersectTargets({ isIntersecting: false })
  expect(onChangeSpy).toHaveBeenCalledTimes(2)
  mockIntersectTargets({ isIntersecting: true })
  expect(onChangeSpy).toHaveBeenCalledTimes(3)

  function TestComponent() {
    const { ref, inView = true } = useInView({
      trackState: true,
      onChange: onChangeSpy,
    })
    return <div ref={ref}>{String(inView)}</div>
  }
})
