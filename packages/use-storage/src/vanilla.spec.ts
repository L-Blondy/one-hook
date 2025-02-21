import { afterEach, expect, expectTypeOf, test } from 'vitest'
import { createStorageService } from './vanilla'
import { cleanup } from '@testing-library/react'
import * as v from 'valibot'

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

test('validate function type inferrence', () => {
  const local_storage = createStorageService({ type: 'local' })
  const session_storage = createStorageService({ type: 'session' })
  expectTypeOf(local_storage).toEqualTypeOf<typeof session_storage>()
  // local
  const l2 = local_storage.getItem('k1', {
    validate: (value) => {
      expectTypeOf(value).toEqualTypeOf<unknown>()
      return String(value)
    },
  })
  expectTypeOf(l2).toEqualTypeOf<string>()
  const l3 = local_storage.setItem('k1', 'v1')
  expectTypeOf(l3).toEqualTypeOf<void>()
  // session
  const s2 = session_storage.getItem('k1', {
    validate: (value) => {
      expectTypeOf(value).toEqualTypeOf<unknown>()
      return String(value)
    },
  })
  expectTypeOf(s2).toEqualTypeOf<string>()
  const s3 = session_storage.setItem('k1', 'v1')
  expectTypeOf(s3).toEqualTypeOf<void>()
  // With custom serialization
  const local_storage_2 = createStorageService({
    type: 'local',
    deserialize: (v) => Number(v),
    serialize: (v) => String(v),
  })
  const session_storage_2 = createStorageService({
    type: 'session',
    deserialize: (v) => Number(v),
    serialize: (v) => String(v),
  })
  expectTypeOf(local_storage_2).toEqualTypeOf<typeof session_storage_2>()
  // local
  const l2_2 = local_storage_2.getItem('k1', {
    validate: (value) => {
      expectTypeOf(value).toEqualTypeOf<number | undefined>()
      return 123 // OK: subset of `typeof value`
    },
  })
  expectTypeOf(l2_2).toEqualTypeOf<123>()
  const l3_2 = local_storage_2.setItem('k1', 1)
  expectTypeOf(l3_2).toEqualTypeOf<void>()
  // session
  const s2_2 = session_storage_2.getItem('k1', {
    validate: (value) => {
      expectTypeOf(value).toEqualTypeOf<number | undefined>()
      return undefined // OK: subset of `typeof value`
    },
  })
  expectTypeOf(s2_2).toEqualTypeOf<undefined>()
  // @ts-expect-error `setItem` value should be a subset a the deserialized type
  const s3_2 = session_storage_2.setItem('k1', '')
  expectTypeOf(s3_2).toEqualTypeOf<void>()
  local_storage_2.getItem('k1', {
    // @ts-expect-error The validate return type should be a subset of the deserialized type
    validate: (value) => {
      expectTypeOf(value).toEqualTypeOf<number | undefined>()
      return String(value) // Error: should be a subset of `typeof value`
    },
  })
})

test('validate schema type inferrence', () => {
  // with default serialization
  const storageService = createStorageService({ type: 'local' })
  const l2 = storageService.getItem('k1', {
    validate: v.optional(v.string(), ''),
  })
  expectTypeOf(l2).toEqualTypeOf<string>()

  // With custom serialization
  const storageService_2 = createStorageService({
    type: 'session',
    deserialize: (v) => Number(v),
    serialize: (v) => String(v),
  })
  const l2_2 = storageService_2.getItem('k2', {
    validate: v.optional(v.literal(123), 123),
  })
  expectTypeOf(l2_2).toEqualTypeOf<123>()
})

test('Runtime', () => {
  const local_storage = createStorageService({ type: 'local' })
  expect(() =>
    local_storage.getItem('k1', {
      validate: (value) => (value as any).someKey,
    }),
  ).toThrowError(/someKey/)
  expect(
    local_storage.getItem('k1', {
      validate: (value) => String(value ?? 'fallback'),
    }),
  ).toBe('fallback')
  expect(
    local_storage.getItem('k1', {
      validate: v.optional(v.string(), 'fallback'),
    }),
  ).toBe('fallback')
})

test('Custom serialize / deserialize', () => {
  const local_storage = createStorageService({
    type: 'local',
    serialize: (value) => String(value) + '_',
    deserialize: (value) => value.slice(0, -1),
  })
  local_storage.setItem('key', 'value')
  expect(localStorage.getItem('key')).toBe('value_')
  expect(local_storage.getItem('key', { validate: (x) => x })).toBe('value')
})
