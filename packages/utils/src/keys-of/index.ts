import type { KeysOf } from 'src/types/_keys-of'

/**
 * https://crustack.vercel.app/utils/keys-of/
 */
export function keysOf<O extends Record<PropertyKey, any>>(object: O) {
  return Object.keys(object) as KeysOf<O>
}
