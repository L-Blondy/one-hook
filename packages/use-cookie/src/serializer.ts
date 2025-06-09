// Main caveats:
// - `NaN` becomes `null`
// - `undefined` becomes `null` in arrays
// - Dates are transformed toISOString
// - BigInt throw

/**
 * strings are not modified, everything else is transformed into a stringified object
 */
export const defaultSerializer = (v: unknown) =>
  typeof v === 'string' ? v : JSON.stringify({ $v: v })
export const defaultDeserializer = (v: string) =>
  v.startsWith('{') ? JSON.parse(v).$v : v
