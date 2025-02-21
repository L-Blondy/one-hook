import { afterEach, expect, expectTypeOf, test } from 'vitest'
import { defineContextualState } from '.'
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
  const [Provider, useStateCtx, useSetStateCtx] =
    defineContextualState<string>()

  type Init = string | (() => string)

  function Wrapper(props: { children: React.ReactNode }) {
    return <Provider initialState={'' as Init}>{props.children}</Provider>
  }

  renderHook(
    () => {
      const [state, setState] = useStateCtx()
      const set = useSetStateCtx()
      expectTypeOf(state).toEqualTypeOf<string>()
      expectTypeOf(setState).toEqualTypeOf<
        React.Dispatch<React.SetStateAction<string>>
      >()
      expectTypeOf(set).toEqualTypeOf<
        React.Dispatch<React.SetStateAction<string>>
      >()
    },
    { wrapper: Wrapper },
  )
})

test('defineContextualState()[0] Should be just like useState with no initializer', () => {
  const [Provider, useStateCtx] = defineContextualState<number>()

  function Wrapper(props: { children: React.ReactNode }) {
    return <Provider initialState={0}>{props.children}</Provider>
  }

  const { result } = renderHook(() => useStateCtx(), { wrapper: Wrapper })

  expect(result.current[0]).toBe(0)
  act(() => result.current[1](2))
  expect(result.current[0]).toBe(2)
  act(() => {
    result.current[1]((prev) => prev * prev)
    result.current[1]((prev) => prev * prev)
  })
  expect(result.current[0]).toBe(16)
})

test('defineContextualState()[1] should be a hook that returns a setState function', () => {
  const [Provider, useStateCtx, useSetStateCtx] =
    defineContextualState<number>()

  function Wrapper(props: { children: React.ReactNode }) {
    return <Provider initialState={0}>{props.children}</Provider>
  }

  const { result } = renderHook(
    () => [useStateCtx()[0], useSetStateCtx()] as const,
    { wrapper: Wrapper },
  )

  expect(result.current[0]).toBe(0)
  act(() => result.current[1](2))
  expect(result.current[0]).toBe(2)
  act(() => {
    result.current[1]((prev) => prev * prev)
    result.current[1]((prev) => prev * prev)
  })
  expect(result.current[0]).toBe(16)
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

test('Multiple cohexisiting Providers should have their own store & values', () => {
  const [Provider, useStateCtx] = defineContextualState<number>()

  function MultiTestApp() {
    return (
      <>
        <Provider initialState={1} children={<Counter id="1" />} />
        <Provider initialState={99} children={<Counter id="2" />} />
      </>
    )
  }

  function Counter({ id }: { id: string }) {
    const [count, setCount] = useStateCtx()

    return (
      <div id={id}>
        <button
          data-testid={`${id}-increment`}
          onClick={() => {
            setCount((c) => ++c)
            setCount((c) => ++c)
          }}
        >
          Increment Twice
        </button>
        <div data-testid={`${id}-value`}>{count}</div>
      </div>
    )
  }

  render(<MultiTestApp />)

  expect(screen.getByTestId('1-value').textContent).toBe('1')
  expect(screen.getByTestId('2-value').textContent).toBe('99')
  fireEvent.click(screen.getByTestId('1-increment'))
  fireEvent.click(screen.getByTestId('1-increment'))
  fireEvent.click(screen.getByTestId('2-increment'))
  fireEvent.click(screen.getByTestId('1-increment'))
  expect(screen.getByTestId('1-value').textContent).toBe('7')
  expect(screen.getByTestId('2-value').textContent).toBe('101')
})

const [TestAppProvider, useTestAppState] = defineContextualState<number>()

function TestAppWrapper(props: { children: React.ReactNode }) {
  return <TestAppProvider initialState={0}>{props.children}</TestAppProvider>
}

function TestApp() {
  return (
    <TestAppWrapper>
      <Consumer1 />
      <Consumer2 />
    </TestAppWrapper>
  )
}

function Consumer1() {
  const [state, setState] = useTestAppState()
  return <button onClick={() => setState((s) => ++s)}>Consumer1 {state}</button>
}

function Consumer2() {
  const [state, setState] = useTestAppState()
  return (
    <>
      <button onClick={() => setState((s) => ++s)}>Consumer2 {state}</button>
      {state === 2 && <Consumer3 />}
    </>
  )
}

function Consumer3() {
  const [state, setState] = useTestAppState()
  return (
    <button
      onClick={() => {
        setState((s) => ++s)
        setState((s) => ++s)
      }}
    >
      Consumer3 {state}
    </button>
  )
}
