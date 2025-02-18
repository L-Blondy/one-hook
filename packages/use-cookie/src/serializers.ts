// Main caveats:
// - `NaN` becomes `null`
// - `undefined` becomes `null` in arrays
// - `Date` is transformed toISOString
// - `BigInt` throws

/**
 * strings are not modified, everything else is transformed into a stringified object
 */
export let defaultSerializer = (v: unknown) =>
  typeof v === 'string' ? v : JSON.stringify({ $v: v })
export let defaultDeserializer = (v: string) =>
  v.startsWith('{') ? JSON.parse(v).$v : v
