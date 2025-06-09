import React from 'react'

const nosub = () => () => {}

export function useIsHydrated() {
  return React.useSyncExternalStore(
    nosub,
    () => true,
    () => false,
  )
}
