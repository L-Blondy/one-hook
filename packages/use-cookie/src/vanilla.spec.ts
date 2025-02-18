import { afterEach, expect, expectTypeOf, test } from 'vitest'
import { createCookieService } from './vanilla'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  const cookieService = createCookieService()
  document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0])
    .forEach((key) => key && cookieService.remove(key))
})

test('type inferrence', () => {
  // with default serialization
  const cookieService = createCookieService()
  const l2 = cookieService.get('k1', {
    validate: (value) => {
      expectTypeOf(value).toEqualTypeOf<unknown>()
      return String(value)
    },
  })
  expectTypeOf(l2).toEqualTypeOf<string>()
  const l3 = cookieService.set('k1', 'v1')
  expectTypeOf(l3).toEqualTypeOf<string>()

  // With custom serialization
  const cookieService_2 = createCookieService({
    deserialize: (v) => Number(v),
    serialize: (v) => String(v),
  })
  const l2_2 = cookieService_2.get('k1', {
    validate: (value) => {
      expectTypeOf(value).toEqualTypeOf<number | undefined>()
      return 123 // OK: subset of `typeof value`
    },
  })
  expectTypeOf(l2_2).toEqualTypeOf<123>()
  const l3_2 = cookieService_2.set('k1', 1)
  expectTypeOf(l3_2).toEqualTypeOf<string>()
  cookieService_2.get('k1', {
    // @ts-expect-error The validate return type should be a subset of the deserialized type
    validate: (value) => {
      expectTypeOf(value).toEqualTypeOf<number | undefined>()
      return String(value) // Error: should be a subset of `typeof value`
    },
  })
})

/**
 * Runtime can't be test as to cookies are not available outside of the browser
 *
 */

test('document.cookie is defined in the test environment', () => {
  document.cookie = 'test=value; path=/'
  expect(document.cookie).toBe('test=value')
})

test('Special characters should be encoded in the value', () => {
  const cookieService = createCookieService()
  cookieService.set('cookie1', '{a://^?}')
  expect(document.cookie).toBe('cookie1=%7Ba%3A%2F%2F%5E%3F%7D')
})

test('Special characters should NOT be encoded in the key', () => {
  const cookieService = createCookieService()
  cookieService.set('coo/kie1', '')
  expect(document.cookie).toBe('coo/kie1=')
})

test('In/Out objects should be equal', () => {
  const cookieService = createCookieService()
  cookieService.set('cookie1', {
    a: new Date('2000-01-01').toISOString(),
    b: null,
    c: false,
    d: 0,
    f: [null, '', false, 0], // undefined would become null
  })
  expect(cookieService.get('cookie1', { validate: (x) => x })).toEqual({
    a: new Date('2000-01-01').toISOString(),
    b: null,
    c: false,
    d: 0,
    f: [null, '', false, 0], // undefined would become null
  })
})
