import { afterEach, describe, expect, expectTypeOf, test } from 'vitest'
import { createStorageService } from './vanilla'
import { cleanup } from '@testing-library/react'
import * as v from 'valibot'
import { z } from 'zod/v4'

const local_storage = createStorageService(
  {
    name1: (value) => Number(value ?? 0),
    name2: (data) => String(data ?? ''),
    object: v.optional(v.object({ key: v.string() })),
    zod: z.object({ key: z.string() }).optional(),
    anyValue: (v) => v,
  },
  { type: 'local' },
)

const session_storage = createStorageService(
  { name1: v.optional(v.number(), 0) },
  { type: 'session' },
)

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

test('type inferrence', () => {
  // local
  const value1 = local_storage.get('name1')
  expectTypeOf(value1).toEqualTypeOf<number>()
  local_storage.set('name1', 1)
  const value3 = local_storage.get('zod')
  expectTypeOf(value3).toEqualTypeOf<{ key: string } | undefined>()
  local_storage.set('zod', { key: 'value' })
  // session
  const value2 = session_storage.get('name1')
  expectTypeOf(value2).toEqualTypeOf<number>()
  session_storage.set('name1', 1)
})

describe('parse', () => {
  test('number', () => {
    local_storage.set('name1', 123)
    expect(local_storage.get('name1')).toEqual(123)
  })

  test('object', () => {
    local_storage.set('object', { key: 'value' })
    expect(local_storage.get('object')).toEqual({ key: 'value' })
  })

  test('zod', () => {
    local_storage.set('zod', { key: 'value' })
    expect(local_storage.get('zod')).toEqual({ key: 'value' })
  })
})

test('In/Out objects should be equal', () => {
  local_storage.set('anyValue', {
    a: new Date('2000-01-01').toISOString(),
    b: null,
    c: false,
    d: 0,
    f: [null, '', false, 0], // undefined would become null
  })
  expect(local_storage.get('anyValue')).toEqual({
    a: new Date('2000-01-01').toISOString(),
    b: null,
    c: false,
    d: 0,
    f: [null, '', false, 0], // undefined would become null
  })
})
