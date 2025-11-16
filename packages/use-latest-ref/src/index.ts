import React from 'react'

/**
 * https://one-hook.vercel.app/docs
 */
export function useLatestRef<T>(value: T): { readonly current: T } {
  const ref = React.useRef(value)
  React.useLayoutEffect(() => {
    ref.current = value
  })
  return ref
}
