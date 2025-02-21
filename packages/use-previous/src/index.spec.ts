import { renderHook } from '@testing-library/react'
import { expect, test } from 'vitest'
import { usePrevious } from '.'

test('Should return `undefined` initially', () => {
  const { result } = renderHook(() => usePrevious('value'))
  expect(result.current).toBeUndefined()
})

test('Should return the previous value when the value changes', () => {
  let value = 'value'
  const { result, rerender } = renderHook(() => usePrevious(value))
  value = 'changed'
  rerender()
  expect(result.current).toBe('value')
})

test('prev should be resilient to rerenders', () => {
  let value = 'value'
  const { result, rerender } = renderHook(() => usePrevious(value))
  rerender()
  expect(result.current).toBe(undefined)
})

test('Should accept a custom `isEqual` function', () => {
  let value = { some: 'value' }
  const { result, rerender } = renderHook(() =>
    usePrevious(value, {
      // compare the serialized versions
      isEqual: (prev, next) => JSON.stringify(prev) === JSON.stringify(next),
    }),
  )
  const res1 = result.current
  // same value with different references
  value = { some: 'value' }
  rerender()
  const res2 = result.current
  expect(res1 === res2).toBe(true)
})
