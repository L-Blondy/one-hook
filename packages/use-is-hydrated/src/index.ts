import { useIsomorphicLayoutEffect } from '@1hook/use-isomorphic-layout-effect'
import React from 'react'

export const useIsHydrated = () => {
  const [isHydrated, setIsHydrated] = React.useState(false)
  useIsomorphicLayoutEffect(() => setIsHydrated(true), [])
  return isHydrated
}
