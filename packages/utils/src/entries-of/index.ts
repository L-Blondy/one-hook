import type { EntriesOf } from "src/types";

export function entriesOf<const O extends Record<PropertyKey, any>>(o: O) {
  return Object.entries(o) as EntriesOf<O>;
}
