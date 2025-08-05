import React from 'react'

/**
 * https://one-hook.vercel.app/docs
 */
export function useDebounceValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const token = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(token)
  }, [value, delay])

  return debouncedValue
}
