import { test, expect, expectTypeOf } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { defineActions } from '.'

test('type inference', () => {
  type CounterState = { count: number }

  type ActionsDef = {
    increment: (by: number) => CounterState
    add: (n: number) => CounterState
    reset: () => CounterState
  }

  type Actions = {
    increment: (by: number) => void
    add: (n: number) => void
    reset: () => void
  }

  const actionsDef = (state: CounterState): ActionsDef => ({
    increment: (by: number) => ({ count: state.count + by }),
    add: (n: number) => ({ count: state.count + n }),
    reset: () => ({ count: 0 }),
  })

  const useCounter = defineActions(actionsDef)

  renderHook(() => {
    const [count, actions] = useCounter({ count: 0 })

    expectTypeOf(count).toEqualTypeOf<CounterState>()
    expectTypeOf(actions).toEqualTypeOf<Actions>()
  })
})

test('type inference generics', () => {
  const useArray = defineActions(<T = any>(state: T[]) => ({
    push: (item: T) => [...state, item],
  }))

  renderHook(() => {
    const [array, actions] = useArray([true, false])

    expectTypeOf(array).toEqualTypeOf<boolean[]>()
    expectTypeOf(actions.push).toEqualTypeOf<(item: boolean) => void>()
  })

  renderHook(() => {
    const [array, actions] = useArray([1, 2, 3])

    expectTypeOf(array).toEqualTypeOf<number[]>()
    expectTypeOf(actions.push).toEqualTypeOf<(item: number) => void>()
  })

  renderHook(() => {
    const [array, actions] = useArray<string>([])

    expectTypeOf(array).toEqualTypeOf<string[]>()
    expectTypeOf(actions.push).toEqualTypeOf<(item: string) => void>()
  })
})

test('actions shoud update the state', () => {
  type CounterState = { count: number }

  const useCounter = defineActions((state: CounterState) => ({
    increment: (by: number) => ({ count: state.count + by }),
    add: (n: number) => ({ count: state.count + n }),
    reset: () => ({ count: 0 }),
  }))

  const { result } = renderHook(() => useCounter({ count: 0 }))

  expect(result.current[0].count).toBe(0)

  act(() => {
    result.current[1].increment(1)
  })
  expect(result.current[0].count).toBe(1)

  act(() => {
    result.current[1].add(5)
  })
  expect(result.current[0].count).toBe(6)

  act(() => {
    result.current[1].reset()
  })
  expect(result.current[0].count).toBe(0)
})
