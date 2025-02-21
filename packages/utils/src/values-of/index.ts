import type { ValuesOf } from 'src/types'

export const valuesOf = <O extends Record<PropertyKey, any>>(object: O) =>
  Object.values(object) as ValuesOf<O>
