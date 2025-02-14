import type { KeyOf, Prettify } from 'src/types'

export function stripUndefined<O extends object>(obj?: O): Output<O> {
  let copy = { ...obj } as O
  for (let key in copy) {
    if (copy[key] === undefined) delete copy[key]
  }
  return copy as any as Output<O>
}

type Output<O> = Prettify<
  O extends unknown
    ? {
        [K in KeyOfUndefinedValue<O>]?: O[K]
      } & {
        [K in Exclude<keyof O, KeyOfUndefinedValue<O>>]: O[K]
      }
    : never
>

type KeyOfUndefinedValue<O> = {
  [Key in keyof O]: O[Key] extends infer U
    ? U extends undefined
      ? Key
      : never
    : never
}[KeyOf<O>]
