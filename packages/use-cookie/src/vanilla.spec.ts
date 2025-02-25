import { afterEach, describe, expect, expectTypeOf, test } from 'vitest'
import { createCookieService } from './vanilla'
import { cleanup } from '@testing-library/react'
import * as v from 'valibot'

const service = createCookieService({
  name1: {
    validate: (data) => String(data ?? ''),
  },
  name2: {
    validate: v.fallback(v.number(), 0),
  },
  'spe/cial': {
    validate: (v) => v,
  },
  object: {
    validate: v.optional(
      v.object({
        key: v.string(),
      }),
    ),
  },
  anyCookie: {
    validate: (v) => v,
  },
})

afterEach(() => {
  cleanup()
  document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0])
    .forEach((name) => name && service.remove(name as any))
})

test('type inferrence', () => {
  const value1 = service.get('name1')
  expectTypeOf(value1).toEqualTypeOf<string>()
  const value2 = service.get('name2')
  expectTypeOf(value2).toEqualTypeOf<number>()
  const value3 = service.get('object')
  expectTypeOf(value3).toEqualTypeOf<{ key: string } | undefined>()
})

test('Special characters should be encoded in the value', () => {
  service.set('name1', '{a://^?')
  expect(document.cookie).toBe('name1=%7Ba%3A%2F%2F%5E%3F')
})

test('Special characters should NOT be encoded in the key', () => {
  service.set('spe/cial', '')
  expect(document.cookie).toBe('spe/cial=')
})

describe('parse', () => {
  test('number', () => {
    service.set('name2', 123)
    expect(service.get('name2')).toEqual(123)
  })

  test('object', () => {
    service.set('object', { key: 'value' })
    expect(service.get('object')).toEqual({ key: 'value' })
  })
})

test('In/Out objects should be equal', async () => {
  service.set('anyCookie', {
    a: new Date('2000-01-01').toISOString(),
    b: null,
    c: false,
    d: 0,
    f: [null, '', false, 0], // undefined would become null
  })
  expect(await service.get('anyCookie')).toEqual({
    a: new Date('2000-01-01').toISOString(),
    b: null,
    c: false,
    d: 0,
    f: [null, '', false, 0], // undefined would become null
  })
})
