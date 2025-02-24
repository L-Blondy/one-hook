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
import { createCookieService } from './vanilla'
import * as v from 'valibot'

afterEach(() => {
  cleanup()
  // clear test cookies
  const cookieService = createCookieService()
  document.cookie
    .split(';')
    .map((c) => c.split('=')[0]!.trim())
    .forEach((cookieName) => cookieService.remove(cookieName))
})

test('<CookieProvider> requires the `serverCookies`', () => {
  const { CookieProvider } = defineCookies({}, {})
  // @ts-expect-error missing serverCookies
  const _ = <CookieProvider>children</CookieProvider>
  // ok
  render(<CookieProvider serverCookies={{}}>children</CookieProvider>)
})

test('type inferrence', () => {
  const { CookieProvider, useCookie } = defineCookies({
    ch1: { validate: (value) => Number(value) },
    ch2: { validate: (value) => String(value) },
    ch3: { validate: v.optional(v.object({ key: v.string() })) },
  })
  renderHook(
    () => {
      const [state1, setState1] = useCookie('ch1')
      expectTypeOf(state1).toEqualTypeOf<number>()
      expectTypeOf(setState1).toEqualTypeOf<
        React.Dispatch<React.SetStateAction<number>>
      >()
      const [state2, setState2] = useCookie('ch2')
      expectTypeOf(state2).toEqualTypeOf<string>()
      expectTypeOf(setState2).toEqualTypeOf<
        React.Dispatch<React.SetStateAction<string>>
      >()
      const [state3, setState3] = useCookie('ch3')
      expectTypeOf(state3).toEqualTypeOf<undefined | { key: string }>()
      expectTypeOf(setState3).toEqualTypeOf<
        React.Dispatch<React.SetStateAction<undefined | { key: string }>>
      >()
    },
    { wrapper: CookieWrapper },
  )

  function CookieWrapper(props: { children: React.ReactNode }) {
    return <CookieProvider serverCookies={{}}>{props.children}</CookieProvider>
  }
})

test('serverCookies should be used for the initial State, decoded, parsed and validated', () => {
  const { CookieProvider, useCookie } = defineCookies({
    ch1: { validate: (value) => Number(value) },
    ch2: { validate: (value) => String(value) },
    ch3: { validate: (value) => value },
    ch4: { validate: (value) => value },
  })

  function CookieWrapper(props: { children: React.ReactNode }) {
    return (
      <CookieProvider
        serverCookies={{
          ch1: '48',
          ch2: '84',
          ch3: '{"$v": "value"}',
          ch4: '{"$v": {"key": "value"}}',
        }}
        {...props}
      />
    )
  }

  const { result } = renderHook(
    () => {
      const [state1] = useCookie('ch1')
      const [state2] = useCookie('ch2')
      const [state3] = useCookie('ch3')
      const [state4] = useCookie('ch4')
      return { state1, state2, state3, state4 }
    },
    { wrapper: CookieWrapper },
  )
  expect(result.current.state1).toBe(48)
  expect(result.current.state2).toBe('84')
  expect(result.current.state3).toBe('value')
  expect(result.current.state4).toEqual({ key: 'value' })
})

test('Should be just like useState, but shared', () => {
  const { CookieProvider, useCookie } = defineCookies({
    ch1: { validate: (value) => Number(value ?? 0) },
  })

  function CookieWrapper(props: { children: React.ReactNode }) {
    return <CookieProvider serverCookies={{}} {...props} />
  }
  const { result } = renderHook(
    () => {
      const [state1, setState1] = useCookie('ch1')
      const [state2, setState2] = useCookie('ch1')
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

test('clearCookies should reset all states if not specified', () => {
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

test('hooks should sync when `serverCookies` change', () => {
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
