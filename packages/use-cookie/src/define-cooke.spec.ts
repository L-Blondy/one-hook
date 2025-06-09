import { afterEach, describe, expect, expectTypeOf, test } from 'vitest'
import { defineCookie } from './define-cookie'
import { act, cleanup, renderHook } from '@testing-library/react'
import type React from 'react'
import { z } from 'zod/v4'

afterEach(() => {
  cleanup()
  const [_, cookie] = defineCookie({
    validate: z.object({ count: z.number() }).default({ count: 0 }),
    name: 'test',
  })
  cookie.remove()
})

describe('type inference', () => {
  type State = { count: number }
  const [useCookie, cookie] = defineCookie({
    validate: z.object({ count: z.number() }).default({ count: 0 }),
    name: 'test',
  })

  test('useCookie', () => {
    renderHook(() => {
      const [state, setState] = useCookie()
      expectTypeOf(state).toEqualTypeOf<State>()
      expectTypeOf(setState).toEqualTypeOf<
        React.Dispatch<React.SetStateAction<State>>
      >()
    })
  })

  test('cookie', () => {
    expectTypeOf(cookie.get()).toEqualTypeOf<State>()
    expectTypeOf(cookie.set).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<State>>
    >()
  })
})

test('setCookie from useCookie should update all useCookie hooks', () => {
  const [useCookie] = defineCookie({
    validate: z.string().default(''),
    name: 'test',
  })

  const hook1 = renderHook(() => useCookie())
  const hook2 = renderHook(() => useCookie())

  act(() => hook1.result.current[1]('1'))
  expect(hook1.result.current[0]).toBe('1')
  expect(hook2.result.current[0]).toBe('1')
  act(() => hook2.result.current[1]('2'))
  expect(hook1.result.current[0]).toBe('2')
  expect(hook2.result.current[0]).toBe('2')
})

test('setCookie from cookie.set should update all useCookie hooks', () => {
  const [useCookie, cookie] = defineCookie({
    validate: z.string().default(''),
    name: 'test',
  })

  const hook1 = renderHook(() => useCookie())
  const hook2 = renderHook(() => useCookie())

  act(() => cookie.set('1'))
  expect(hook1.result.current[0]).toBe('1')
  expect(hook2.result.current[0]).toBe('1')
  act(() => cookie.set('2'))
  expect(hook1.result.current[0]).toBe('2')
  expect(hook2.result.current[0]).toBe('2')
})

test('cookie.get should return the initialState initially', () => {
  const [, cookie] = defineCookie({
    validate: z.string().default(''),
    name: 'test',
  })
  expect(cookie.get()).toBe('')
})

test('cookie.get should return the latest value', () => {
  const [useCookie, cookie] = defineCookie({
    validate: z.string().default(''),
    name: 'test',
  })

  const hook1 = renderHook(() => useCookie())

  act(() => hook1.result.current[1]('1'))
  expect(cookie.get()).toBe('1')
})

test('cookie.set and setCookie should support function updater', () => {
  const [useCookie, cookie] = defineCookie({
    validate: z.number().default(0),
    name: 'test',
  })

  const hook1 = renderHook(() => useCookie())

  act(() => {
    hook1.result.current[1]((c) => ++c)
    hook1.result.current[1]((c) => ++c)
  })
  expect(hook1.result.current[0]).toBe(2)
  act(() => {
    cookie.set((c) => ++c)
    cookie.set((c) => ++c)
  })
  expect(hook1.result.current[0]).toBe(4)
})

test('after calling remove, the validator default value should be used', () => {
  const [useCookie, cookie] = defineCookie({
    validate: z.string().default(''),
    name: 'test',
  })

  const hook = renderHook(() => useCookie())
  act(() => hook.result.current[1]('val'))
  expect(hook.result.current[0]).toBe('val')
  act(() => cookie.remove())
  expect(hook.result.current[0]).toBe('')
})
