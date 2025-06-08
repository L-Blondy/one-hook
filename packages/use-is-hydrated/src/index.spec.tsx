import { test } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsHydrated } from '.'

test('Should not crash', () => {
  renderHook(() => useIsHydrated())
})
