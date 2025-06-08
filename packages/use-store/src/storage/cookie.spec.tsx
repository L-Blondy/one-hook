import { afterEach, describe, expect, expectTypeOf, test } from 'vitest'
import { defineStore } from '../define-store'
import {
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import type React from 'react'
import { cookie } from './cookie'
import { z } from 'zod/v4'

afterEach(() => {
  cleanup()
  const service = cookie({ validate: z.any(), name: 'test' })
  service.set(undefined)
})

describe('type inference', () => {
  type State = { count: number }
  const [useStore, store] = defineStore({
    storage: cookie({
      validate: z.object({ count: z.number() }).default({ count: 0 }),
      name: 'test',
    }),
  })

  test('useStore', () => {
    renderHook(() => {
      const [state, setState] = useStore()
      expectTypeOf(state).toEqualTypeOf<State>()
      expectTypeOf(setState).toEqualTypeOf<
        React.Dispatch<React.SetStateAction<State>>
      >()
    })
  })

  test('store', () => {
    // store.get can be called outside of the Provider. In that case the state is undefined
    expectTypeOf(store.get()).toEqualTypeOf<State>()
    expectTypeOf(store.set).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<State>>
    >()
  })
})

test('setStore from useStore should update all useStore hooks', () => {
  const [useStore] = defineStore({
    storage: cookie({
      validate: z.string().default(''),
      name: 'test',
    }),
  })

  function App() {
    return (
      <div>
        <Input testId="input1" />
        <Input testId="input2" />
      </div>
    )
  }

  function Input({ testId }: { testId: string }) {
    const [value, setStore] = useStore()
    return (
      <input
        value={value}
        onChange={(e) => setStore(e.target.value)}
        data-testid={testId}
      />
    )
  }

  render(<App />)

  fireEvent.change(screen.getByTestId('input1'), { target: { value: '1' } })
  expect(screen.getByTestId('input1').getAttribute('value')).toBe('1')
  expect(screen.getByTestId('input2').getAttribute('value')).toBe('1')
  fireEvent.change(screen.getByTestId('input2'), { target: { value: '2' } })
  expect(screen.getByTestId('input1').getAttribute('value')).toBe('2')
  expect(screen.getByTestId('input2').getAttribute('value')).toBe('2')
})

test('setStore from store.set should update all useStore hooks', () => {
  const [useStore, store] = defineStore({
    storage: cookie({
      validate: z.string().default(''),
      name: 'test',
    }),
  })

  function App() {
    return (
      <div>
        <Input testId="input1" />
        <Input testId="input2" />
      </div>
    )
  }

  function Input({ testId }: { testId: string }) {
    const [value] = useStore()
    return (
      <input
        value={value}
        onChange={(e) => store.set(e.target.value)}
        data-testid={testId}
      />
    )
  }

  render(<App />)

  fireEvent.change(screen.getByTestId('input1'), { target: { value: '1' } })
  expect(screen.getByTestId('input1').getAttribute('value')).toBe('1')
  expect(screen.getByTestId('input2').getAttribute('value')).toBe('1')
  fireEvent.change(screen.getByTestId('input2'), { target: { value: '2' } })
  expect(screen.getByTestId('input1').getAttribute('value')).toBe('2')
  expect(screen.getByTestId('input2').getAttribute('value')).toBe('2')
})

test('store.get should return the initialState initially', () => {
  const [, store] = defineStore({
    storage: cookie({
      validate: z.string().default(''),
      name: 'test',
    }),
  })
  expect(store.get()).toBe('')
})

test('store.get should return the latest value', () => {
  const [useStore, store] = defineStore({
    storage: cookie({
      validate: z.string().default(''),
      name: 'test',
    }),
  })

  function App() {
    return (
      <div>
        <Input testId="input1" />
        <Input testId="input2" />
      </div>
    )
  }

  function Input({ testId }: { testId: string }) {
    const [value, setStore] = useStore()
    return (
      <input
        value={value}
        onChange={(e) => setStore(e.target.value)}
        data-testid={testId}
      />
    )
  }

  render(<App />)
  expect(store.get()).toBe('')
  fireEvent.change(screen.getByTestId('input1'), { target: { value: '1' } })
  expect(store.get()).toBe('1')
})

test('store.set and setStore should support function updater', () => {
  const [useStore, store] = defineStore({
    storage: cookie({
      validate: z.number().default(0),
      name: 'test',
    }),
  })

  function App() {
    return (
      <div>
        <IncrementTwice />
        <DecrementTwice />
      </div>
    )
  }

  function IncrementTwice() {
    const [value, setStore] = useStore()
    return (
      <button
        data-testid="increment-twice"
        data-value={value}
        onClick={() => {
          setStore((c) => c + 1)
          setStore((c) => c + 1)
        }}
      >
        {value}
      </button>
    )
  }

  function DecrementTwice() {
    const [value] = useStore()
    return (
      <button
        data-testid="decrement-twice"
        onClick={() => {
          store.set((c) => --c)
          store.set((c) => --c)
        }}
      >
        {value}
      </button>
    )
  }

  render(<App />)

  fireEvent.click(screen.getByTestId('increment-twice'))
  expect(screen.getByTestId('increment-twice').textContent).toBe('2')
  expect(screen.getByTestId('decrement-twice').textContent).toBe('2')
  fireEvent.click(screen.getByTestId('decrement-twice'))
  expect(screen.getByTestId('increment-twice').textContent).toBe('0')
  expect(screen.getByTestId('decrement-twice').textContent).toBe('0')
})
