import { useSyncExternalStore } from 'react'

let subs = 0

function subscribe(getSnapshot: () => void) {
  ++subs
  window.addEventListener('online', getSnapshot, { passive: true })
  window.addEventListener('offline', getSnapshot, { passive: true })
  return () => {
    if (!--subs) {
      window.removeEventListener('online', getSnapshot)
      window.removeEventListener('offline', getSnapshot)
    }
  }
}

export function useIsOnline() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}
