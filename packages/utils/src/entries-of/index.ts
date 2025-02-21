import type { EntriesOf } from 'src/types'

export const entriesOf = <const O extends Record<PropertyKey, any>>(o: O) =>
  Object.entries(o) as EntriesOf<O>
