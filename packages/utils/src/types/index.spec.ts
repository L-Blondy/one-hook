import { expectTypeOf, test } from 'vitest'
import type {
  KeyOf,
  EntryOf,
  ValueOf,
  ValuesOf,
  KeysOf,
  EntriesOf,
  Prettify,
  Defined,
} from '.'

test('KeyOf', () => {
  const k1: KeyOf<{ a: 1; b: '' }> = {} as any
  expectTypeOf(k1).toEqualTypeOf<'a' | 'b'>()

  const k2: KeyOf<{ a: 1; b: 1 } | { c?: undefined }> = {} as any
  expectTypeOf(k2).toEqualTypeOf<'a' | 'b' | 'c'>()
})

test('KeysOf', () => {
  const k1: KeysOf<{ a: 1; b: '' }> = {} as any
  expectTypeOf(k1).toEqualTypeOf<Array<'a' | 'b'>>()

  const k2: KeysOf<{ a: 1; b: 1 } | { c?: undefined }> = {} as any
  expectTypeOf(k2).toEqualTypeOf<Array<'a' | 'b'> | Array<'c'>>()
})

test('EntryOf', () => {
  const e1: EntryOf<{ a: number; b: string }> = {} as any
  expectTypeOf(e1).toEqualTypeOf<['a', number] | ['b', string]>()

  const e2: EntryOf<Partial<{ a: number; b: string }>> = {} as any
  expectTypeOf(e2).toEqualTypeOf<
    ['a', number | undefined] | ['b', string | undefined]
  >()

  const e3: EntryOf<{ a: number; b: string } | { c?: boolean; d?: null }> =
    {} as any
  expectTypeOf(e3).toEqualTypeOf<
    | ['a', number]
    | ['b', string]
    | ['c', boolean | undefined]
    | ['d', null | undefined]
  >()
})

test('EntriesOf', () => {
  const e1: EntriesOf<{ a: number; b: string }> = {} as any
  expectTypeOf(e1).toEqualTypeOf<Array<['a', number] | ['b', string]>>()

  const e2: EntriesOf<Partial<{ a: number; b: string }>> = {} as any
  expectTypeOf(e2).toEqualTypeOf<
    Array<['a', number | undefined] | ['b', string | undefined]>
  >()

  const e3: EntriesOf<{ a: 1; b: '' } | { c?: boolean; d?: null }> = {} as any
  expectTypeOf(e3).toEqualTypeOf<
    | Array<['a', 1] | ['b', '']>
    | Array<['c', boolean | undefined] | ['d', null | undefined]>
  >()
})

test('ValueOf', () => {
  const k1: ValueOf<{ a: 1; b: '' }> = {} as any
  expectTypeOf(k1).toEqualTypeOf<1 | ''>()

  const k2: ValueOf<{ a: 1; b: 7 } | { c?: undefined; d?: null }> = {} as any
  expectTypeOf(k2).toEqualTypeOf<1 | 7 | undefined | null>()

  const k3: ValueOf<{ a?: 1 }> = {} as any
  expectTypeOf(k3).toEqualTypeOf<1 | undefined>()
})

test('ValuesOf', () => {
  const k1: ValuesOf<{ a: 1; b: '' }> = {} as any
  expectTypeOf(k1).toEqualTypeOf<Array<1 | ''>>()

  const k2: ValuesOf<{ a: 1; b: 7 } | { c?: boolean; d?: null }> = {} as any
  expectTypeOf(k2).toEqualTypeOf<
    Array<1 | 7> | Array<boolean | null | undefined>
  >()

  const k3: ValuesOf<{ a?: 1 }> = {} as any
  expectTypeOf(k3).toEqualTypeOf<Array<1 | undefined>>()
})

test('Prettify', () => {
  // types should not be modified
  const p1: Prettify<{ a: number } | ({ b: number } & { c: null })> = {} as any
  expectTypeOf(p1).toEqualTypeOf<{ a: number } | { b: number; c: null }>()

  const p2: Prettify<string | null> = {} as any
  expectTypeOf(p2).toEqualTypeOf<string | null>()

  const p3: Prettify<string | (null & { b?: number })> = {} as any
  expectTypeOf(p3).toEqualTypeOf<string | (null & { b?: number })>()

  type T1 = { a: number; b?: string }
  type T2 = { b: string; c: boolean }

  const p4: Prettify<T1 & T2> = {} as any
  expectTypeOf(p4).toEqualTypeOf<{ a: number; b: string; c: boolean }>()

  const p5: Prettify<T1> = {} as any
  expectTypeOf(p5).toEqualTypeOf<T1>()

  const p6: Prettify<T1 | T2> = {} as any
  expectTypeOf(p6).toEqualTypeOf<T1 | T2>()
})

test('Defined', () => {
  const d1: Defined<number | undefined | null> = {} as any
  expectTypeOf(d1).toEqualTypeOf<number | null>()
})
