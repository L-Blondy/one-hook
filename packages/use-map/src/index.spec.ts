import { act, renderHook } from '@testing-library/react'
import { expect, expectTypeOf, test } from 'vitest'
import { useMap } from '.'

test('Should return a map-like object', () => {
  const { result } = renderHook(() => useMap())
  expect(typeof result.current.clear).toBe('function')
  expect(typeof result.current.delete).toBe('function')
  expect(typeof result.current.entries).toBe('function')
  expect(typeof result.current.forEach).toBe('function')
  expect(typeof result.current.get).toBe('function')
  expect(typeof result.current.has).toBe('function')
  expect(typeof result.current.keys).toBe('function')
  expect(typeof result.current.reset).toBe('function')
  expect(typeof result.current.set).toBe('function')
  expect(typeof result.current.size).toBe('number')
  expect(typeof result.current.values).toBe('function')
})

test('Should have a stable identity', () => {
  const { result, rerender } = renderHook(() => useMap())
  const before = result.current
  rerender()
  expect(before).toBe(result.current)
})

test('Using `set` should generate a new Map WHEN the value is absent', async () => {
  const { result } = renderHook(() => useMap())
  const before = result.current
  await act(() => result.current.set(1, 2))
  expect(before).not.toBe(result.current)
})

test('Using `set` should NOT generate a new Map WHEN the value is present', async () => {
  const { result } = renderHook(() => useMap([[1, 2]]))
  const before = result.current
  await act(() => result.current.set(1, 2))
  expect(before).toBe(result.current)
})

test('`set` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.set
  rerender()
  expect(before).toBe(result.current.set)
})

test('Using `delete` should generate a new Map WHEN the value is present in the Set', async () => {
  const { result } = renderHook(() => useMap([[1, 2]]))
  const before = result.current
  await act(() => result.current.delete(1))
  expect(before).not.toBe(result.current)
})

test('Using `delete` should NOT generate a new Map WHEN the value is absent from the Set', async () => {
  const { result } = renderHook(() => useMap())
  const before = result.current
  await act(() => result.current.delete(1))
  expect(before).toBe(result.current)
})

test('`delete` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.delete
  rerender()
  expect(before).toBe(result.current.delete)
})

test('Using `clear` should generate a new Map WHEN the Set is populated', () => {
  const { result } = renderHook(() => useMap([[1, 2]]))
  const before = result.current
  act(() => result.current.clear())
  expect(before).not.toBe(result.current)
})

test('Using `clear` should NOT generate a new Map WHEN the value is empty', () => {
  const { result } = renderHook(() => useMap())
  const before = result.current
  act(() => result.current.clear())
  expect(before).toBe(result.current)
})

test('`clear` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.clear
  rerender()
  expect(before).toBe(result.current.clear)
})

test('`values` return value should be memoized', () => {
  const { result, rerender } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.values()
  rerender()
  expect(before).toBe(result.current.values())
})

test('`values` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.values
  rerender()
  expect(before).toBe(result.current.values)
})

test('`values` return value should change when setting the state', async () => {
  const { result } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.values()
  await act(() => result.current.set(4, 19))
  expect(before).not.toBe(result.current.values())
  expect(before).toEqual([2])
  expect(result.current.values()).toEqual([2, 19])
})

test('`keys` return value should be memoized', () => {
  const { result, rerender } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.keys()
  rerender()
  expect(before).toBe(result.current.keys())
})

test('`keys` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.keys
  rerender()
  expect(before).toBe(result.current.keys)
})

test('`keys` return value should change when setting the state', async () => {
  const { result } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.keys()
  await act(() => result.current.set(4, 19))
  expect(before).not.toBe(result.current.keys())
  expect(before).toEqual([1])
  expect(result.current.keys()).toEqual([1, 4])
})

test('`entries` return value should be memoized', () => {
  const { result, rerender } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.entries()
  rerender()
  expect(before).toBe(result.current.entries())
})

test('`entries` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.entries
  rerender()
  expect(before).toBe(result.current.entries)
})

test('`entries` return value should change when setting the state', async () => {
  const { result } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.entries()
  await act(() => result.current.set(4, 19))
  expect(before).not.toBe(result.current.entries())
  expect(before).toEqual([[1, 2]])
  expect(result.current.entries()).toEqual([
    [1, 2],
    [4, 19],
  ])
})

test('`reset` should override all values', () => {
  const { result } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.values()
  act(() => result.current.reset(new Map([[2, 3]])))
  expect(before).not.toBe(result.current.values())
  expect(result.current.values()).toEqual([3])
})

test('`reset` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.reset
  rerender()
  expect(before).toBe(result.current.reset)
})

test('`has` should indicate if a key is present', () => {
  const { result } = renderHook(() => useMap([[1, 2]]))
  const { has } = result.current
  expect(has(1)).toBe(true)
  expect(has(2)).toBe(false)
})

test('`has` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.has
  rerender()
  expect(before).toBe(result.current.has)
})

test('`get` should return the value or undefined', () => {
  const { result } = renderHook(() => useMap([[1, '']]))
  const { get } = result.current
  expect(get(1)).toBe('')
  expect(get(2)).toBe(undefined)
  expectTypeOf(get(2)).toEqualTypeOf<string | undefined>()
})

test('`get` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useMap([[1, 2]]))
  const before = result.current.get
  rerender()
  expect(before).toBe(result.current.get)
})

test('`size` should give the number of items in the set', async () => {
  const { result, rerender } = renderHook(() =>
    useMap(
      new Map([
        [1, 99],
        [2, 100],
      ]),
    ),
  )
  const { size, set } = result.current
  expect(size).toBe(2)
  await act(() => set(0, 7))
  rerender()
  expect(result.current.size).toBe(3)
})

test('When setting the state, references should be preserved', async () => {
  const v1 = [{ key: '' }, { value: '' }] as [any, any]
  const v2 = [[], []] as [any, any]
  const { result, rerender } = renderHook(() => useMap([v1, v2]))
  rerender()
  expect(result.current.get(v1[0])).toBe(v1[1])
  expect(result.current.get(v2[0])).toBe(v2[1])
  await act(() => result.current.set(1, 2))
  expect(result.current.get(v1[0])).toBe(v1[1])
  expect(result.current.get(v2[0])).toBe(v2[1])
})

test('The set itself is spreadable', () => {
  const { result } = renderHook(() => useMap([[1, 99]]))
  expect([...result.current]).toEqual([[1, 99]])
})
