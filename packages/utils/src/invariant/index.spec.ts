import { afterEach, expect, expectTypeOf, test } from 'vitest'
import { invariant } from '.'

afterEach(() => {
  invariant.config({})
})

test('type guard', function () {
  const condition = true as boolean
  invariant(condition, 'invariant error')
  expectTypeOf(condition).toEqualTypeOf<true>()
})

test('invariant should not throw an error for a `true` condition', () => {
  expect(() => invariant(true, 'invariant error')).not.toThrow()
  expect(() => invariant(true, () => 'invariant error')).not.toThrow()
})

test('invariant should not throw an error for a `false` condition', () => {
  expect(() => invariant(false, 'invariant error 1')).toThrow(
    'invariant error 1',
  )
  expect(() => invariant(false, () => 'invariant error 2')).toThrow(
    'invariant error 2',
  )
})

test('When `invariant.config.stripMessage = ()=> true` the message should be an empty string', () => {
  invariant.config({ stripMessage: true })
  expect(() => invariant(false, 'invariant error 1')).toThrow('')
  expect(() => invariant(false, () => 'invariant error 2')).toThrow('')
})
