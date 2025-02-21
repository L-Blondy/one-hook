import { afterEach, expect, expectTypeOf, test } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import { defineStorage } from './define-storage'
import React from 'react'
import { noop } from '@rebase.io/utils/noop'
import * as v from 'valibot'

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

function initLocalStorage() {
  const { useLocalStorage, useClearLocalStorage } = defineStorage(
    {
      ch1: {
        validate: (value) => Number(value ?? 0),
      },
      ch2: { validate: v.optional(v.string(), 'init') },
    },
    { type: 'local' },
  )
  expectTypeOf(useLocalStorage).not.toBeNullable()
  expectTypeOf(useClearLocalStorage).not.toBeNullable()
  return { useLocalStorage, useClearLocalStorage } as const
}

function initSessionStorage() {
  // define Session Storage just for type testing
  const { useSessionStorage, useClearSessionStorage } = defineStorage(
    {
      ch1: { validate: (value) => Number(value) },
      ch2: { validate: (value) => String(value) },
    },
    {
      type: 'session',
      serialize: (value) => String(value),
      deserialize: (value) => Number(value),
    },
  )
  expectTypeOf(useSessionStorage).not.toBeNullable()
  expectTypeOf(useClearSessionStorage).not.toBeNullable()
  return { useSessionStorage, useClearSessionStorage } as const
}

noop(initSessionStorage)

test('type inferrence', () => {
  const { useLocalStorage } = initLocalStorage()
  renderHook(() => {
    const [state1, setState1] = useLocalStorage('ch1')
    expectTypeOf(state1).toEqualTypeOf<number>()
    expectTypeOf(setState1).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<number>>
    >()
    const [state2, setState2] = useLocalStorage('ch2')
    expectTypeOf(state2).toEqualTypeOf<string>()
    expectTypeOf(setState2).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<string>>
    >()
  })
})

test('Should be just like useState, but shared', () => {
  const { useLocalStorage } = initLocalStorage()
  const { result } = renderHook(() => {
    const [state1, setState1] = useLocalStorage('ch1')
    const [state2, setState2] = useLocalStorage('ch1')
    return { state1, setState1, state2, setState2 }
  })
  expect(result.current.state1).toBe(0)
  expect(result.current.state2).toBe(0)
  act(() => result.current.setState1(2))
  expect(result.current.state1).toBe(2)
  expect(result.current.state2).toBe(2)
  act(() => {
    result.current.setState1((prev) => prev * prev)
    result.current.setState1((prev) => prev * prev)
  })
  expect(result.current.state1).toBe(16)
  expect(result.current.state2).toBe(16)
})

test('Should sync between different components', () => {
  const TestApp = initTestApp()
  render(<TestApp />)

  screen.getByText('Consumer1 0')
  screen.getByText('Consumer2 0')
  fireEvent.click(screen.getByText('Consumer1 0'))
  screen.getByText('Consumer1 1')
  screen.getByText('Consumer2 1')
})

test('The initial state should be the current state, not the defined initialState', () => {
  const TestApp = initTestApp()
  render(<TestApp />)

  screen.getByText('Consumer1 0')
  screen.getByText('Consumer2 0')
  fireEvent.click(screen.getByText('Consumer1 0'))
  fireEvent.click(screen.getByText('Consumer1 1'))
  screen.getByText('Consumer1 2')
  screen.getByText('Consumer2 2')
  screen.getByText('Consumer3 2')
})

test('clearStorage should reset all states if not specified', () => {
  const TestApp = initTestApp()
  render(<TestApp />)

  screen.getByText('Consumer1 0')
  fireEvent.click(screen.getByText('Consumer4 init'))
  screen.getByText('Consumer4 changed')
  fireEvent.click(screen.getByText('Consumer1 0'))
  fireEvent.click(screen.getByText('Consumer1 1'))
  // call clearStorage
  fireEvent.click(screen.getByText('Consumer3 2'))
  screen.getByText('Consumer1 0')
  screen.getByText('Consumer2 0')
  screen.getByText('Consumer4 init')
})

test('clearStorage should reset only the specified keys', () => {
  const TestApp = initTestApp()
  render(<TestApp keysToReset={['ch1']} />)

  screen.getByText('Consumer1 0')
  fireEvent.click(screen.getByText('Consumer4 init'))
  screen.getByText('Consumer4 changed')
  fireEvent.click(screen.getByText('Consumer1 0'))
  fireEvent.click(screen.getByText('Consumer1 1'))
  // call clearStorage
  fireEvent.click(screen.getByText('Consumer3 2'))
  screen.getByText('Consumer1 0')
  screen.getByText('Consumer2 0')
  // not reset
  screen.getByText('Consumer4 changed')
})

type UseClearLocalStorage = ReturnType<
  typeof initLocalStorage
>['useClearLocalStorage']

function initTestApp() {
  const { useLocalStorage, useClearLocalStorage } = initLocalStorage()

  type KeysToReset = NonNullable<
    NonNullable<Parameters<ReturnType<UseClearLocalStorage>>[0]>['keys']
  >

  function TestApp(props: { keysToReset?: KeysToReset }) {
    return (
      <>
        <Consumer1 />
        <Consumer2 keysToReset={props.keysToReset} />
        <Consumer4 />
      </>
    )
  }

  function Consumer1() {
    const [state, setState] = useLocalStorage('ch1')
    return (
      <button onClick={() => setState((s) => ++s)}>Consumer1 {state}</button>
    )
  }

  function Consumer2(props: { keysToReset?: KeysToReset }) {
    const [state, setState] = useLocalStorage('ch1')
    return (
      <>
        <button onClick={() => setState((s) => ++s)}>Consumer2 {state}</button>
        {state === 2 && <Consumer3 keysToReset={props.keysToReset} />}
      </>
    )
  }

  function Consumer3(props: { keysToReset?: KeysToReset }) {
    const [state] = useLocalStorage('ch1')
    const clearStorage = useClearLocalStorage()
    return (
      <button onClick={() => clearStorage({ keys: props.keysToReset })}>
        Consumer3 {state}
      </button>
    )
  }

  function Consumer4() {
    const [state, setState] = useLocalStorage('ch2')
    return (
      <button onClick={() => setState('changed')}>Consumer4 {state}</button>
    )
  }

  return TestApp
}
