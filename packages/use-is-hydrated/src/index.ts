import { useSyncExternalStore } from 'react'

const nosub = () => () => {}

export function useIsHydrated() {
  return useSyncExternalStore(
    nosub,
    () => true,
    () => false,
  )
}
