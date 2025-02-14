import type { ValuesOf } from 'src/types/_values-of'

/**
 * https://crustack.vercel.app/utils/values-of/
 */
export function valuesOf<O extends Record<PropertyKey, any>>(object: O) {
  return Object.values(object) as ValuesOf<O>
}
