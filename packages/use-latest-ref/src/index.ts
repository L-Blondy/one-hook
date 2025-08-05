import React from 'react'
import { useIsomorphicLayoutEffect } from '@1hook/use-isomorphic-layout-effect'

/**
 * https://one-hook.vercel.app/docs
 */
export function useLatestRef<T>(value: T): { readonly current: T } {
  const ref = React.useRef(value)
  useIsomorphicLayoutEffect(() => {
    ref.current = value
  })
  return ref
}
