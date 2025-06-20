import type React from 'react'

export type KeyOf<O> = O extends unknown ? keyof O : never

export type KeysOf<O> = O extends unknown
  ? {
      [Key in KeyOf<O>]: Key
    }[KeyOf<O>][]
  : never

export type EntryOf<O> = EntriesOf<O>[number]

export type EntriesOf<O> = O extends unknown
  ? {
      [Key in KeyOf<O>]: [Key, O[Key]]
    }[KeyOf<O>][]
  : never

export type ValueOf<O> = O extends unknown ? O[KeyOf<O>] : never

export type ValuesOf<O> = O extends unknown
  ? {
      [Key in KeyOf<O>]: O[Key]
    }[KeyOf<O>][]
  : never

export type AnyFunction = (...args: any[]) => any

export type Prettify<O> = O extends any
  ? O extends Record<PropertyKey, any>
    ? {
        [K in keyof O]: O[K]
      } & {}
    : O
  : never

export type MaybeRef<T> = T | React.MutableRefObject<T>

export type MaybePromise<T> = T | Promise<T>

export type Defined<T> = T extends undefined ? never : T

export type Falsy = null | undefined | false | 0 | ''
