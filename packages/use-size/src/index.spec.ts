import { it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSize } from '.'

it('Should not crash', () => {
  renderHook(() => useSize())
})
