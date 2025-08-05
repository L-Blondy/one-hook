import { useSyncExternalStore } from 'react'

const allListeners = new Set<() => void>()
const callAllListeners = () => allListeners.forEach((l) => l())

function subscribe(getSnapshot: () => void) {
  allListeners.add(getSnapshot)
  if (allListeners.size === 1) {
    window.addEventListener('online', callAllListeners, { passive: true })
    window.addEventListener('offline', callAllListeners, { passive: true })
  }
  return () => {
    allListeners.delete(getSnapshot)
    if (allListeners.size === 0) {
      window.removeEventListener('online', callAllListeners)
      window.removeEventListener('offline', callAllListeners)
    }
  }
}

/**
 * https://one-hook.vercel.app/docs
 */
export function useIsOnline() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}
