import type { EntriesOf } from 'src/types/_entries-of'

/**
 * https://crustack.vercel.app/utils/entries-of/
 */
export function entriesOf<const O extends Record<PropertyKey, any>>(o: O) {
  return Object.entries(o) as EntriesOf<O>
}
