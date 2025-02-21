import { expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDomId } from 'src'

it('Should return an id starting with a letter', () => {
  const { result } = renderHook(() => useDomId())
  expect(result.current.startsWith('a')).toBe(true)
})
