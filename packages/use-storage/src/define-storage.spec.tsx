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

const [useLocalStorage, LocalStorage] = defineStorage(
  {
    name1: (data) => String(data ?? ''),
    name2: v.fallback(v.number(), 0),
    object: v.optional(v.object({ key: v.string() })),
    anyCookie: (v) => {
      expectTypeOf(v).toEqualTypeOf<unknown>()
      return v
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
    const state1 = useLocalStorage('name1')
    expectTypeOf(state1.value).toEqualTypeOf<string>()
    expectTypeOf(state1.set).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<string>>
    >()
    const state2 = useLocalStorage('name2')
    expectTypeOf(state2.value).toEqualTypeOf<number>()
    expectTypeOf(state2.set).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<number>>
    >()
    const state3 = useLocalStorage('object')
    expectTypeOf(state3.value).toEqualTypeOf<{ key: string } | undefined>()
    expectTypeOf(state3.set).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<{ key: string }>>
    >()
    expectTypeOf(LocalStorage.get('name1')).toEqualTypeOf<string>()
  })
})

test('should behave like useState with shared state between hooks', () => {
  const { result } = renderHook(() => {
    const state1 = useLocalStorage('name2')
    const state2 = useLocalStorage('name2')
    return { state1, state2 }
  })
  expect(result.current.state1.value).toBe(0)
  expect(result.current.state2.value).toBe(0)
  act(() => result.current.state1.set(2))
  expect(result.current.state1.value).toBe(2)
  expect(result.current.state2.value).toBe(2)
  act(() => {
    result.current.state1.set((prev) => prev * prev)
    result.current.state1.set((prev) => prev * prev)
  })
  expect(result.current.state1.value).toBe(16)
  expect(result.current.state2.value).toBe(16)
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

const [useAppStorage, appClientStorage] = defineStorage(
  {
    ch1: (v) => Number(v ?? 0),
    ch2: (v) => String(v ?? 'init'),
  },
  { type: 'local' },
)

type KeysToReset = NonNullable<
  Parameters<(typeof appClientStorage)['clear']>[0]
>

function initTestApp() {
  function TestApp(props: {
    keysToReset?: KeysToReset
    serverCookies?: Record<string, string>
  }) {
    React.useEffect(() => () => appClientStorage.clear(), [])
    return (
      <div>
        <Consumer1 />
        <Consumer2 keysToReset={props.keysToReset} />
        <Consumer4 />
      </div>
    )
  }

  function Consumer1() {
    const state = useAppStorage('ch1')
    return (
      <button onClick={() => state.set((s) => ++s)}>
        Consumer1 {state.value}
      </button>
    )
  }

  function Consumer2(props: { keysToReset?: KeysToReset }) {
    const state = useAppStorage('ch1')
    return (
      <>
        <button onClick={() => state.set((s) => ++s)}>
          Consumer2 {state.value}
        </button>
        {state.value === 2 && <Consumer3 keysToReset={props.keysToReset} />}
      </>
    )
  }

  function Consumer3(props: { keysToReset?: KeysToReset }) {
    const state = useAppStorage('ch1')
    return (
      <button onClick={() => appClientStorage.clear(props.keysToReset)}>
        Consumer3 {state.value}
      </button>
    )
  }

  function Consumer4() {
    const state = useAppStorage('ch2')
    return (
      <button onClick={() => state.set('changed')}>
        Consumer4 {state.value}
      </button>
    )
  }

  return TestApp
}
