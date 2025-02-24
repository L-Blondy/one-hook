import React from 'react'
import { useIsomorphicLayoutEffect } from '@1hook/use-isomorphic-layout-effect'

export function useLatestRef<T>(value: T): { readonly current: T } {
  const ref = React.useRef(value)
  useIsomorphicLayoutEffect(() => {
    ref.current = value
  })
  return ref
}
