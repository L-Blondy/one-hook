import { it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLatestRef } from 'src'

it('Should not crash', () => {
  renderHook(() => useLatestRef(() => {}))
})
