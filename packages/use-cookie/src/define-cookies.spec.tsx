import { afterEach, expect, expectTypeOf, test } from 'vitest'
import { defineCookies } from './define-cookies'
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

const { CookieProvider, useCookie, cookieService } = defineCookies({
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
    validate: (v) => v,
  },
})

afterEach(() => {
  cleanup()
  // clear test cookies
  document.cookie
    .split(';')
    .map((c) => c.split('=')[0]!.trim())
    .forEach((name) => name && cookieService.remove(name as any))
})

test('type inferrence', () => {
  renderHook(
    () => {
      const [state1, setState1] = useCookie('name1')
      expectTypeOf(state1).toEqualTypeOf<string>()
      expectTypeOf(setState1).toEqualTypeOf<
        React.Dispatch<React.SetStateAction<string>>
      >()
      const [state2, setState2] = useCookie('name2')
      expectTypeOf(state2).toEqualTypeOf<number>()
      expectTypeOf(setState2).toEqualTypeOf<
        React.Dispatch<React.SetStateAction<number>>
      >()
      const [state3, setState3] = useCookie('object')
      expectTypeOf(state3).toEqualTypeOf<{ key: string } | undefined>()
      expectTypeOf(setState3).toEqualTypeOf<
        React.Dispatch<React.SetStateAction<{ key: string } | undefined>>
      >()
    },
    { wrapper: CookieWrapper },
  )

  function CookieWrapper(props: { children: React.ReactNode }) {
    return <CookieProvider serverCookies={{}}>{props.children}</CookieProvider>
  }
})

test('should initialize state from server cookies with proper decoding, parsing and validation', () => {
  function CookieWrapper(props: { children: React.ReactNode }) {
    return (
      <CookieProvider
        serverCookies={{
          name1: '48',
          name2: '{"$v": 84}',
          object: '{"$v": {"key": "value"}}',
        }}
        {...props}
      />
    )
  }

  const { result } = renderHook(
    () => {
      const [state1] = useCookie('name1')
      const [state2] = useCookie('name2')
      const [state3] = useCookie('object')
      return { state1, state2, state3 }
    },
    { wrapper: CookieWrapper },
  )
  expect(result.current.state1).toBe('48')
  expect(result.current.state2).toBe(84)
  expect(result.current.state3).toEqual({ key: 'value' })
})

test('should behave like useState with shared state between hooks', () => {
  function CookieWrapper(props: { children: React.ReactNode }) {
    return <CookieProvider serverCookies={{}} {...props} />
  }
  const { result } = renderHook(
    () => {
      const [state1, setState1] = useCookie('name2')
      const [state2, setState2] = useCookie('name2')
      return { state1, setState1, state2, setState2 }
    },
    { wrapper: CookieWrapper },
  )
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

test('hooks should update when serverCookies cookies are modified', () => {
  const { rerender } = render(<TestApp serverCookies={{ ch1: '20' }} />)
  screen.getByText('Consumer1 20')
  rerender(<TestApp serverCookies={{ ch1: '30' }} />)
  screen.getByText('Consumer1 30')
})

const {
  CookieProvider: AppCookiesProvider,
  useCookie: useAppCookie,
  useClearCookies: useClearAppCookies,
} = defineCookies({
  ch1: { validate: (v) => Number(v ?? 0) },
  ch2: { validate: (v) => String(v ?? 'init') },
})

type KeysToReset = NonNullable<
  NonNullable<Parameters<ReturnType<typeof useClearAppCookies>>[0]>['keys']
>

function TestApp(props: {
  keysToReset?: KeysToReset
  serverCookies?: Record<string, string>
}) {
  return (
    <AppCookiesProvider serverCookies={props.serverCookies ?? {}}>
      <Consumer1 />
      <Consumer2 keysToReset={props.keysToReset} />
      <Consumer4 />
    </AppCookiesProvider>
  )
}

function Consumer1() {
  const [state, setState] = useAppCookie('ch1')
  return <button onClick={() => setState((s) => ++s)}>Consumer1 {state}</button>
}

function Consumer2(props: { keysToReset?: KeysToReset }) {
  const [state, setState] = useAppCookie('ch1')
  return (
    <>
      <button onClick={() => setState((s) => ++s)}>Consumer2 {state}</button>
      {state === 2 && <Consumer3 keysToReset={props.keysToReset} />}
    </>
  )
}

function Consumer3(props: { keysToReset?: KeysToReset }) {
  const [state] = useAppCookie('ch1')
  const clearCookies = useClearAppCookies()
  return (
    <button onClick={() => clearCookies({ keys: props.keysToReset })}>
      Consumer3 {state}
    </button>
  )
}

function Consumer4() {
  const [state, setState] = useAppCookie('ch2')
  return <button onClick={() => setState('changed')}>Consumer4 {state}</button>
}
