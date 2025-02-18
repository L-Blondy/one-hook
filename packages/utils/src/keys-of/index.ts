import type { KeysOf } from "src/types";

export function keysOf<O extends Record<PropertyKey, any>>(object: O) {
  return Object.keys(object) as KeysOf<O>;
}
