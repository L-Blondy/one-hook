import type { KeysOf } from 'src/types'

export const keysOf = <O extends Record<PropertyKey, any>>(object: O) =>
  Object.keys(object) as KeysOf<O>
