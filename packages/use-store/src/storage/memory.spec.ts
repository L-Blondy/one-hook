import { afterEach, describe, expect, expectTypeOf, test } from 'vitest'
import { defineStore } from '../define-store'
import { act, cleanup, renderHook } from '@testing-library/react'
import type React from 'react'
import { memory } from './memory'

afterEach(() => cleanup())

describe('type inference', () => {
  type State = { count: number }
  const [useStore, store] = defineStore({
    storage: memory({ initialState: { count: 0 } }),
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
    expectTypeOf(store.get()).toEqualTypeOf<State>()
    expectTypeOf(store.set).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<State>>
    >()
  })
})

test('setStore from useStore should update all useStore hooks', () => {
  const [useStore] = defineStore({
    storage: memory({ initialState: '' }),
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
    storage: memory({ initialState: '' }),
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
    storage: memory({ initialState: '' }),
  })
  expect(store.get()).toBe('')
})

test('store.get should return the latest value', () => {
  const [useStore, store] = defineStore({
    storage: memory({ initialState: '' }),
  })

  const hook1 = renderHook(() => useStore())

  act(() => hook1.result.current[1]('1'))
  expect(store.get()).toBe('1')
})

test('store.set and setStore should support function updater', () => {
  const [useStore, store] = defineStore({
    storage: memory({ initialState: 0 }),
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
