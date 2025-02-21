/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectTypeOf, test } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEventHandler } from '.'

test('type inferrence', () => {
  renderHook(() => {
    const fn2 = useEventHandler(() => {})
    expectTypeOf(fn2).toEqualTypeOf<() => void>()
    const fn3 = useEventHandler((a: string) => true)
    expectTypeOf(fn3).toEqualTypeOf<(a: string) => boolean>()
    const fn4 = useEventHandler(<T>(a: T) => '' as T)
    expectTypeOf(fn4).toEqualTypeOf<<T>(a: T) => T>()
    // undefined produces a void function
    const fn1 = useEventHandler(undefined)
    expectTypeOf(fn1).toEqualTypeOf<() => void>()
  })
})
