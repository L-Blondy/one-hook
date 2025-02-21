import { afterEach, expect, expectTypeOf, test } from 'vitest'
import { defineGlobalState } from '.'
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import React from 'react'

afterEach(cleanup)

test('type inferrence', () => {
  const [useGlobalState, set] = defineGlobalState({
    initialState: { count: 0 },
  })

  renderHook(() => {
    const [state, setState] = useGlobalState()
    expectTypeOf(state).toEqualTypeOf<{ count: number }>()
    expectTypeOf(setState).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<{ count: number }>>
    >()
    expectTypeOf(set).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<{ count: number }>>
    >()
  })
})

test('defineGlobalState()[0] Should be just like useState, but global', () => {
  const [useGlobalState] = defineGlobalState({
    initialState: { count: 0 },
  })

  const { result } = renderHook(() => {
    const [state1, setState1] = useGlobalState()
    const [state2, setState2] = useGlobalState()
    return { state1, setState1, state2, setState2 }
  })

  expect(result.current.state1).toEqual({ count: 0 })
  expect(result.current.state2).toEqual({ count: 0 })
  act(() => result.current.setState1({ count: 2 }))
  expect(result.current.state1).toEqual({ count: 2 })
  expect(result.current.state2).toEqual({ count: 2 })
  act(() => {
    result.current.setState1((prev) => ({ count: prev.count * prev.count }))
    result.current.setState1((prev) => ({ count: prev.count * prev.count }))
  })
  expect(result.current.state1).toEqual({ count: 16 })
  expect(result.current.state2).toEqual({ count: 16 })
})

test('defineGlobalState()[1] Should be a function that sets the state', () => {
  const [useGlobalState, setGlobalState] = defineGlobalState({
    initialState: { count: 0 },
  })

  const { result, rerender } = renderHook(() => {
    const [state] = useGlobalState()
    return { state }
  })

  expect(result.current.state).toEqual({ count: 0 })
  setGlobalState({ count: 10 })
  rerender()
  expect(result.current.state).toEqual({ count: 10 })
})

test('Should sync between different components', () => {
  render(<TestApp />)

  screen.getByText('Consumer1 0')
  screen.getByText('Consumer2 0')
  fireEvent.click(screen.getByText('Consumer1 0'))
  screen.getByText('Consumer1 1')
  screen.getByText('Consumer2 1')
})

test('The initial state should be the current state, not the defined initialState', () => {
  render(<TestApp />)

  screen.getByText('Consumer1 0')
  screen.getByText('Consumer2 0')
  fireEvent.click(screen.getByText('Consumer1 0'))
  fireEvent.click(screen.getByText('Consumer1 1'))
  screen.getByText('Consumer1 2')
  screen.getByText('Consumer2 2')
  screen.getByText('Consumer3 2')
})

test('The functional version should guarantee to have the latest value', () => {
  render(<TestApp />)

  fireEvent.click(screen.getByText('Consumer1 0'))
  fireEvent.click(screen.getByText('Consumer1 1'))
  fireEvent.click(screen.getByText('Consumer3 2'))
  screen.getByText('Consumer2 4')
})

const [useTestAppState, setTestAppState] = defineGlobalState({
  initialState: { count: 0 },
})

// reset the test app store between each test
afterEach(() => setTestAppState({ count: 0 }))

function TestApp() {
  return (
    <>
      <Consumer1 />
      <Consumer2 />
    </>
  )
}

function Consumer1() {
  const [state, setState] = useTestAppState()
  return (
    <button onClick={() => setState((prev) => ({ count: ++prev.count }))}>
      Consumer1 {state.count}
    </button>
  )
}

function Consumer2() {
  const [state, setState] = useTestAppState()
  return (
    <>
      <button onClick={() => setState((prev) => ({ count: ++prev.count }))}>
        Consumer2 {state.count}
      </button>
      {state.count === 2 && <Consumer3 />}
    </>
  )
}

function Consumer3() {
  const [state, setState] = useTestAppState()
  return (
    <button
      onClick={() => {
        setState((prev) => ({ count: ++prev.count }))
        setState((prev) => ({ count: ++prev.count }))
      }}
    >
      Consumer3 {state.count}
    </button>
  )
}
