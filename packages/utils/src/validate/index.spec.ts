import { expect, expectTypeOf, it } from 'vitest'
import * as v from 'valibot'
import { validate, validateSync } from '.'
import { invariant } from 'src/invariant'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import { isValidationError } from './schema-validation-error'
import { noop } from 'src/noop'
import { z } from 'zod/v4'

const schema = v.pipe(
  v.object({
    key: v.string(),
  }),
  v.transform((input) => ({
    ...input,
    other: 'other',
  })),
)

const asyncSchema = z
  .object({
    key: z.string(),
  })
  .transform((o) => ({ ...o, other: 'other' }))

it('type inference', () => {
  function testValidateSync() {
    const d1 = validateSync(schema, { key: 'value' })
    expectTypeOf(d1).toEqualTypeOf<{ key: string; other: string }>()
    // @ts-expect-error
    const d2 = validateSync(schema, { key: 1 })
    expectTypeOf(d2).toEqualTypeOf<{ key: string; other: string }>()

    const d3 = validateSync((_data: number) => '', 1)
    expectTypeOf(d3).toEqualTypeOf<string>()
    // @ts-expect-error
    const d4 = validateSync((_data: number) => '', '')
    expectTypeOf(d4).toEqualTypeOf<string>()
  }
  async function testValidate() {
    const d1 = await validate(schema, { key: 'value' })
    expectTypeOf(d1).toEqualTypeOf<{ key: string; other: string }>()
    // @ts-expect-error
    const d2 = await validate(schema, { key: 1 })
    expectTypeOf(d2).toEqualTypeOf<{ key: string; other: string }>()

    const d3 = await validate((_data: number) => '', 1)
    expectTypeOf(d3).toEqualTypeOf<string>()
    // @ts-expect-error
    const d4 = await validate((_data: number) => '', '')
    expectTypeOf(d4).toEqualTypeOf<string>()
    // async schema
    const d5 = await validate(asyncSchema, { key: 'value' })
    expectTypeOf(d5).toEqualTypeOf<{ key: string; other: string }>()
    // async fn
    const d6 = await validate((_: string) => Promise.resolve(1), 'str')
    expectTypeOf(d6).toEqualTypeOf<number>()
  }
  noop(testValidateSync, testValidate)
})

it('validateSync schema should return the parsed value', () => {
  const input = { key: 'value' } as const
  const output = validateSync(schema, input)
  const expected = { key: 'value', other: 'other' }
  expect(output).toEqual(expected)
})

it('validateSync function should return the parsed value', () => {
  const validationFn = (input: number) => String(input)
  const input = 1
  const output = validateSync(validationFn, input)
  expect(output).toEqual('1')
})

it('validate schema should return the parsed value', async () => {
  const input = { key: 'value' } as const
  const output = await validate(asyncSchema, input)
  const expected = { key: 'value', other: 'other' }
  expect(output).toEqual(expected)
})

it('validate function should return the parsed value', async () => {
  const validationFn = (input: number) => Promise.resolve(String(input))
  const input = 1
  const output = await validate(validationFn, input)
  expect(output).toEqual('1')
})

it('Should raise a ValidationError when receiving a schema', () => {
  const schema = v.object({
    key: v.string(),
  })
  let errorCatched: any
  try {
    validateSync(schema, { key: 1 as any })
  } catch (error) {
    errorCatched = error
    invariant(isValidationError(error), 'Should be a validation error')
    expect(error.name).toBe('ValidationError')
    expect(Array.isArray(error.issues)).toBe(true)
    expectTypeOf(error.issues).toEqualTypeOf<
      Readonly<StandardSchemaV1.Issue[]>
    >()
  }
  expect(!!errorCatched).toBe(true)
})
