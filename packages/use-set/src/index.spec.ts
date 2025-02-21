import { act, renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import { useSet } from '.'

test('Should return a set-like object', () => {
  const { result } = renderHook(() => useSet(new Set()))
  expect(typeof result.current.add).toBe('function')
  expect(typeof result.current.clear).toBe('function')
  expect(typeof result.current.has).toBe('function')
  expect(typeof result.current.delete).toBe('function')
  expect(typeof result.current.reset).toBe('function')
  expect(typeof result.current.size).toBe('number')
  expect(typeof result.current.values).toBe('function')
})

test('Should have a stable identity', () => {
  const { result, rerender } = renderHook(() => useSet(new Set()))
  const before = result.current
  rerender()
  expect(before).toBe(result.current)
})

test('Using `add` should generate a new Set WHEN the value is absent from the Set', async () => {
  const { result } = renderHook(() => useSet(new Set()))
  const before = result.current
  await act(() => result.current.add(1))
  expect(before).not.toBe(result.current)
})

test('Using `add` should NOT generate a new Set WHEN the value is present in the Set', async () => {
  const { result } = renderHook(() => useSet(new Set([1])))
  const before = result.current
  await act(() => result.current.add(1))
  expect(before).toBe(result.current)
})

test('`add` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useSet(new Set([1])))
  const before = result.current.add
  rerender()
  expect(before).toBe(result.current.add)
})

test('Using `delete` should generate a new Set WHEN the value is present in the Set', async () => {
  const { result } = renderHook(() => useSet(new Set([1])))
  const before = result.current
  await act(() => result.current.delete(1))
  expect(before).not.toBe(result.current)
})

test('Using `delete` should NOT generate a new Set WHEN the value is absent from the Set', async () => {
  const { result } = renderHook(() => useSet(new Set()))
  const before = result.current
  await act(() => result.current.delete(1))
  expect(before).toBe(result.current)
})

test('`delete` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useSet(new Set([1])))
  const before = result.current.delete
  rerender()
  expect(before).toBe(result.current.delete)
})

test('Using `clear` should generate a new Set WHEN the Set is populated', () => {
  const { result } = renderHook(() => useSet(new Set([1])))
  const before = result.current
  act(() => result.current.clear())
  expect(before).not.toBe(result.current)
})

test('Using `clear` should NOT generate a new Set WHEN the value is empty', () => {
  const { result } = renderHook(() => useSet(new Set()))
  const before = result.current
  act(() => result.current.clear())
  expect(before).toBe(result.current)
})

test('`clear` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useSet(new Set([1])))
  const before = result.current.clear
  rerender()
  expect(before).toBe(result.current.clear)
})

test('`values` return value should be memoized', async () => {
  const { result, rerender } = renderHook(() => useSet(new Set([1])))
  const before = result.current.values()
  rerender()
  expect(before).toBe(result.current.values())
  await act(() => result.current.add(2)) // generate new values
  expect(before).not.toBe(result.current.values())
})

test('`values` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useSet(new Set([1])))
  const before = result.current.values
  rerender()
  expect(before).toBe(result.current.values)
})

test('`values` return value should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useSet(new Set([1])))
  const before = result.current.values()
  rerender()
  expect(before).toBe(result.current.values())
})

test('`values` return value should change when setting the state', async () => {
  const { result } = renderHook(() => useSet(new Set([1])))
  const before = result.current.values()
  await act(() => result.current.add(19))
  expect(before).not.toBe(result.current.values())
  expect(before).toEqual([1])
  expect(result.current.values()).toEqual([1, 19])
})

test('`reset` should override all values', () => {
  const { result } = renderHook(() => useSet(new Set([1])))
  const before = result.current.values()
  act(() => result.current.reset(new Set([2])))
  expect(before).not.toBe(result.current.values())
  expect(result.current.values()).toEqual([2])
})

test('`reset` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useSet(new Set([1])))
  const before = result.current.reset
  rerender()
  expect(before).toBe(result.current.reset)
})

test('`has` should indicate if a value is in the set', () => {
  const { result } = renderHook(() => useSet(new Set([1])))
  const { has } = result.current
  expect(has(1)).toBe(true)
  expect(has(2)).toBe(false)
})

test('`has` should have a stable reference', () => {
  const { result, rerender } = renderHook(() => useSet(new Set([1])))
  const before = result.current.has
  rerender()
  expect(before).toBe(result.current.has)
})

test('`size` should give the number of items in the set', async () => {
  const { result, rerender } = renderHook(() => useSet(new Set([1, 99])))
  const { size, add } = result.current
  expect(size).toBe(2)
  await act(() => add(0))
  rerender()
  expect(result.current.size).toBe(3)
})

test('When setting the state, references should be preserved', async () => {
  const v1 = {}
  const v2 = [null]
  const { result, rerender } = renderHook(() => useSet([v1, v2]))
  rerender()
  expect(result.current.has(v1)).toBe(true)
  expect(result.current.has(v2)).toBe(true)
  await act(() => result.current.add({}))
  expect(result.current.has(v1)).toBe(true)
  expect(result.current.has(v2)).toBe(true)
})

test('The set itself is spreadable', () => {
  const { result } = renderHook(() => useSet([1, 99]))
  expect([...result.current]).toEqual([1, 99])
})
