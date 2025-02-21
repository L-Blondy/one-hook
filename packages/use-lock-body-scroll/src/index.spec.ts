import { it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLockBodyScroll } from '.'

it('Should not crash', () => {
  renderHook(() => useLockBodyScroll())
})
