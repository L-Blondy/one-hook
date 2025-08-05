import React from 'react'

const nosub = () => () => {}

/**
 * https://one-hook.vercel.app/docs
 */
export function useIsHydrated() {
  return React.useSyncExternalStore(
    nosub,
    () => true,
    () => false,
  )
}
