import { it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useIsOnline } from 'src'

it('Should not crash', () => {
  renderHook(() => useIsOnline())
})
