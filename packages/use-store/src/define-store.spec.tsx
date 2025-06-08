import { afterEach, describe, expect, expectTypeOf, test } from 'vitest'
import { defineStore } from './define-store'
import {
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react'
import type React from 'react'
import { noop } from '@1hook/utils/noop'

afterEach(() => cleanup())

describe('type inference', () => {
  type State = { count: number }
  const [useStore, Provider, store] = defineStore<State>()

  test('useStore', () => {
    renderHook(
      () => {
        const [state, setState] = useStore()
        expectTypeOf(state).toEqualTypeOf<State>()
        expectTypeOf(setState).toEqualTypeOf<
          React.Dispatch<React.SetStateAction<State>>
        >()
      },
      {
        wrapper: (props) => <Provider {...props} initialState={{ count: 0 }} />,
      },
    )
  })

  test('Provider', () => {
    const [, Provider] = defineStore<State>()

    function Ok() {
      return (
        <Provider initialState={{ count: 0 }}>
          <div>children</div>
        </Provider>
      )
    }
    function NotOk() {
      return (
        // @ts-expect-error invalid initial state
        <Provider initialState={undefined}>
          <div>children</div>
        </Provider>
      )
    }

    noop(Ok)
    noop(NotOk)
  })

  test('store', () => {
    // store.get can be called outside of the Provider. In that case the state is undefined
    expectTypeOf(store.get()).toEqualTypeOf<State | undefined>()
    expectTypeOf(store.set).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<State>>
    >()
  })
})

test.fails('Should not allow using useStore outside of the Provider', () => {
  const [useStore] = defineStore()
  renderHook(() => useStore())
})

test('setStore from useStore should update all useStore hooks', () => {
  const [useStore, Provider] = defineStore<string>()

  function App() {
    return (
      <Provider initialState="">
        <Input testId="input1" />
        <Input testId="input2" />
      </Provider>
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

test('setStore from store should update all useStore hooks', () => {
  const [useStore, Provider, store] = defineStore<string>()

  function App() {
    return (
      <Provider initialState="">
        <Input testId="input1" />
        <Input testId="input2" />
      </Provider>
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

test('store.get should return undefined by default', () => {
  const [, , store] = defineStore<string>()
  expect(store.get()).toBe(undefined)
})

test('store.get should return the latest value', () => {
  const [useStore, Provider, store] = defineStore<string>()

  function App() {
    return (
      <Provider initialState="">
        <Input testId="input1" />
        <Input testId="input2" />
      </Provider>
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
  const [useStore, Provider, store] = defineStore<number>()

  function App() {
    return (
      <Provider initialState={0}>
        <IncrementTwice />
        <DecrementTwice />
      </Provider>
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
