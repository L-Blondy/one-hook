import { expectTypeOf, test } from 'vitest'
import { renderHook } from '@testing-library/react'
import { px } from '.'

test('type inferrence', () => {
  renderHook(() => {
    expectTypeOf(px(undefined)).toEqualTypeOf<undefined>()
    expectTypeOf(px('string')).toEqualTypeOf<string>()
    expectTypeOf(px(1)).toEqualTypeOf<string>()
  })
})
