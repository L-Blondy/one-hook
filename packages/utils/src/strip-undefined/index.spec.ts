import { expectTypeOf, test } from 'vitest'
import { stripUndefined } from '.'

test('type inferrence', () => {
  const o1: {
    a: number | undefined
    b: undefined
    c?: string
    d?: string | undefined
    e: boolean
  } = {} as any

  // keys with undefined values should become optional
  expectTypeOf(stripUndefined(o1)).toEqualTypeOf<{
    a?: number | undefined
    b?: undefined
    c?: string
    d?: string | undefined
    e: boolean
  }>()
})
