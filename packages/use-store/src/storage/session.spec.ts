import { afterEach, describe, expect, expectTypeOf, test } from 'vitest'
import { defineStore } from '../define-store'
import { act, cleanup, renderHook } from '@testing-library/react'
import type React from 'react'
import { session } from './session'
import { z } from 'zod/v4'

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

describe('type inference', () => {
  type State = { count: number }
  const [useStore, store] = defineStore({
    storage: session({
      validate: z.object({ count: z.number() }).default({ count: 0 }),
      key: 'test',
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
    storage: session({
      validate: z.string().default(''),
      key: 'test',
    }),
  })

  const hook1 = renderHook(() => useStore())
  const hook2 = renderHook(() => useStore())

  act(() => hook1.result.current[1]('1'))
  expect(hook1.result.current[0]).toBe('1')
  expect(hook2.result.current[0]).toBe('1')
  act(() => hook2.result.current[1]('2'))
  expect(hook1.result.current[0]).toBe('2')
  expect(hook2.result.current[0]).toBe('2')
})

test('setStore from store.set should update all useStore hooks', () => {
  const [useStore, store] = defineStore({
    storage: session({
      validate: z.string().default(''),
      key: 'test',
    }),
  })

  const hook1 = renderHook(() => useStore())
  const hook2 = renderHook(() => useStore())

  act(() => store.set('1'))
  expect(hook1.result.current[0]).toBe('1')
  expect(hook2.result.current[0]).toBe('1')
  act(() => store.set('2'))
  expect(hook1.result.current[0]).toBe('2')
  expect(hook2.result.current[0]).toBe('2')
})

test('store.get should return the initialState initially', () => {
  const [, store] = defineStore({
    storage: session({
      validate: z.string().default(''),
      key: 'test',
    }),
  })
  expect(store.get()).toBe('')
})

test('store.get should return the latest value', () => {
  const [useStore, store] = defineStore({
    storage: session({
      validate: z.string().default(''),
      key: 'test',
    }),
  })

  const hook1 = renderHook(() => useStore())

  act(() => hook1.result.current[1]('1'))
  expect(store.get()).toBe('1')
})

test('store.set and setStore should support function updater', () => {
  const [useStore, store] = defineStore({
    storage: session({
      validate: z.number().default(0),
      key: 'test',
    }),
  })

  const hook1 = renderHook(() => useStore())

  act(() => {
    hook1.result.current[1]((c) => ++c)
    hook1.result.current[1]((c) => ++c)
  })
  expect(hook1.result.current[0]).toBe(2)
  act(() => {
    store.set((c) => ++c)
    store.set((c) => ++c)
  })
  expect(hook1.result.current[0]).toBe(4)
})

test('after calling remove, the validator default value should be used', () => {
  const [useStore, store] = defineStore({
    storage: session({
      validate: z.string().default(''),
      key: 'test',
    }),
  })

  const hook = renderHook(() => useStore())
  act(() => hook.result.current[1]('val'))
  expect(hook.result.current[0]).toBe('val')
  act(() => store.remove())
  expect(hook.result.current[0]).toBe('')
})
