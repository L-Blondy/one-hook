import { afterEach, expect, expectTypeOf, test } from 'vitest'
import { defineStorage } from './define-storage'
import {
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  act,
} from '@testing-library/react'
import React from 'react'
import * as v from 'valibot'

const { useLocalStorage } = defineStorage(
  {
    name1: {
      validate: (data) => String(data ?? ''),
    },
    name2: {
      validate: v.fallback(v.number(), 0),
    },
    object: {
      validate: v.optional(
        v.object({
          key: v.string(),
        }),
      ),
    },
    anyCookie: {
      validate: (v) => {
        expectTypeOf(v).toEqualTypeOf<unknown>()
        return v
      },
    },
  },
  { type: 'local' },
)

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

test('type inferrence', () => {
  renderHook(() => {
    const [state1, setState1] = useLocalStorage('name1')
    expectTypeOf(state1).toEqualTypeOf<string>()
    expectTypeOf(setState1).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<string>>
    >()
    const [state2, setState2] = useLocalStorage('name2')
    expectTypeOf(state2).toEqualTypeOf<number>()
    expectTypeOf(setState2).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<number>>
    >()
    const [state3, setState3] = useLocalStorage('object')
    expectTypeOf(state3).toEqualTypeOf<{ key: string } | undefined>()
    expectTypeOf(setState3).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<{ key: string } | undefined>>
    >()
  })
})

test('should behave like useState with shared state between hooks', () => {
  const { result } = renderHook(() => {
    const [state1, setState1] = useLocalStorage('name2')
    const [state2, setState2] = useLocalStorage('name2')
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

test('should synchronize state updates across multiple components', () => {
  const TestApp = initTestApp()
  render(<TestApp />)

  // Initial state should be 0 for both consumers
  screen.getByText('Consumer1 0')
  screen.getByText('Consumer2 0')

  // Updating state in one component should update the other
  fireEvent.click(screen.getByText('Consumer1 0'))
  screen.getByText('Consumer1 1')
  screen.getByText('Consumer2 1')
})

test('should initialize new components with current cookie value instead of initial state', () => {
  const TestApp = initTestApp()
  render(<TestApp />)

  // Initial state is 0 for both consumers
  screen.getByText('Consumer1 0')
  screen.getByText('Consumer2 0')

  // Update state to 2 by clicking twice
  fireEvent.click(screen.getByText('Consumer1 0'))
  fireEvent.click(screen.getByText('Consumer1 1'))

  // All consumers, including newly mounted Consumer3, should show current value of 2
  screen.getByText('Consumer1 2')
  screen.getByText('Consumer2 2')
  screen.getByText('Consumer3 2')
})

test('should reset all cookie states when clearCookies is called without specific keys', () => {
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

test('should only reset cookies for specified keys when calling clearStorage', () => {
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

const {
  useLocalStorage: useAppStorage,
  useClearLocalStorage: useClearAppStorage,
} = defineStorage(
  {
    ch1: { validate: (v) => Number(v ?? 0) },
    ch2: { validate: (v) => String(v ?? 'init') },
  },
  { type: 'local' },
)

type KeysToReset = NonNullable<
  NonNullable<Parameters<ReturnType<typeof useClearAppStorage>>[0]>
>

function initTestApp() {
  function TestApp(props: {
    keysToReset?: KeysToReset
    serverCookies?: Record<string, string>
  }) {
    const clear = useClearAppStorage()
    React.useEffect(() => () => clear(), [clear])
    return (
      <div>
        <Consumer1 />
        <Consumer2 keysToReset={props.keysToReset} />
        <Consumer4 />
      </div>
    )
  }

  function Consumer1() {
    const [state, setState] = useAppStorage('ch1')
    return (
      <button onClick={() => setState((s) => ++s)}>Consumer1 {state}</button>
    )
  }

  function Consumer2(props: { keysToReset?: KeysToReset }) {
    const [state, setState] = useAppStorage('ch1')
    return (
      <>
        <button onClick={() => setState((s) => ++s)}>Consumer2 {state}</button>
        {state === 2 && <Consumer3 keysToReset={props.keysToReset} />}
      </>
    )
  }

  function Consumer3(props: { keysToReset?: KeysToReset }) {
    const [state] = useAppStorage('ch1')
    const clearCookies = useClearAppStorage()
    return (
      <button onClick={() => clearCookies(props.keysToReset)}>
        Consumer3 {state}
      </button>
    )
  }

  function Consumer4() {
    const [state, setState] = useAppStorage('ch2')
    return (
      <button onClick={() => setState('changed')}>Consumer4 {state}</button>
    )
  }

  return TestApp
}
