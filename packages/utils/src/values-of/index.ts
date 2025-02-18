import type { ValuesOf } from "src/types";

/**
 * https://crustack.vercel.app/utils/values-of/
 */
export function valuesOf<O extends Record<PropertyKey, any>>(object: O) {
  return Object.values(object) as ValuesOf<O>;
}
