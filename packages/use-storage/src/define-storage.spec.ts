import { afterEach, describe, expect, expectTypeOf, test } from 'vitest'
import { defineStorage } from './define-storage'
import { act, cleanup, renderHook } from '@testing-library/react'
import type React from 'react'
import { z } from 'zod/v4'

afterEach(() => {
  cleanup()
  const [_, storage] = defineStorage({
    validate: z.object({ count: z.number() }).default({ count: 0 }),
    key: 'test',
    type: 'local',
  })
  storage.clear()
})

describe('type inference', () => {
  type State = { count: number }
  const [useStorage, storage] = defineStorage({
    validate: z.object({ count: z.number() }).default({ count: 0 }),
    key: 'test',
    type: 'local',
  })

  test('useStorage', () => {
    renderHook(() => {
      const [state, setState] = useStorage()
      expectTypeOf(state).toEqualTypeOf<State>()
      expectTypeOf(setState).toEqualTypeOf<
        React.Dispatch<React.SetStateAction<State>>
      >()
    })
  })

  test('storage', () => {
    expectTypeOf(storage.get()).toEqualTypeOf<State>()
    expectTypeOf(storage.set).toEqualTypeOf<
      React.Dispatch<React.SetStateAction<State>>
    >()
  })
})

test('setStorage from useStorage should update all useStorage hooks', () => {
  const [useStorage] = defineStorage({
    validate: z.string().default(''),
    key: 'test',
    type: 'local',
  })

  const hook1 = renderHook(() => useStorage())
  const hook2 = renderHook(() => useStorage())

  act(() => hook1.result.current[1]('1'))
  expect(hook1.result.current[0]).toBe('1')
  expect(hook2.result.current[0]).toBe('1')
  act(() => hook2.result.current[1]('2'))
  expect(hook1.result.current[0]).toBe('2')
  expect(hook2.result.current[0]).toBe('2')
})

test('setStorage from storage.set should update all useStorage hooks', () => {
  const [useStorage, storage] = defineStorage({
    validate: z.string().default(''),
    key: 'test',
    type: 'local',
  })

  const hook1 = renderHook(() => useStorage())
  const hook2 = renderHook(() => useStorage())

  act(() => storage.set('1'))
  expect(hook1.result.current[0]).toBe('1')
  expect(hook2.result.current[0]).toBe('1')
  act(() => storage.set('2'))
  expect(hook1.result.current[0]).toBe('2')
  expect(hook2.result.current[0]).toBe('2')
})

test('storage.get should return the initialState initially', () => {
  const [, storage] = defineStorage({
    validate: z.string().default(''),
    key: 'test',
    type: 'local',
  })
  expect(storage.get()).toBe('')
})

test('storage.get should return the latest value', () => {
  const [useStorage, storage] = defineStorage({
    validate: z.string().default(''),
    key: 'test',
    type: 'local',
  })

  const hook1 = renderHook(() => useStorage())

  act(() => hook1.result.current[1]('1'))
  expect(storage.get()).toBe('1')
})

test('storage.set and setStorage should support function updater', () => {
  const [useStorage, storage] = defineStorage({
    validate: z.number().default(0),
    key: 'test',
    type: 'local',
  })

  const hook1 = renderHook(() => useStorage())

  act(() => {
    hook1.result.current[1]((c) => ++c)
    hook1.result.current[1]((c) => ++c)
  })
  expect(hook1.result.current[0]).toBe(2)
  act(() => {
    storage.set((c) => ++c)
    storage.set((c) => ++c)
  })
  expect(hook1.result.current[0]).toBe(4)
})

test('after calling remove, the validator default value should be used', () => {
  const [useStorage, storage] = defineStorage({
    validate: z.string().default(''),
    key: 'test',
    type: 'local',
  })

  const hook = renderHook(() => useStorage())
  act(() => hook.result.current[1]('val'))
  expect(hook.result.current[0]).toBe('val')
  act(() => storage.clear())
  expect(hook.result.current[0]).toBe('')
})
