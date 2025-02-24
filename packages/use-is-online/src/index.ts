import React from 'react'
import { isServer } from '@1hook/utils/is-server'

const listeners = new Set<(online: boolean) => void>()

if (!isServer) {
  window.addEventListener(
    'online',
    () => {
      listeners.forEach((l) => l(true))
    },
    { passive: true },
  )
  window.addEventListener(
    'offline',
    () => {
      listeners.forEach((l) => l(false))
    },
    { passive: true },
  )
}

export function useIsOnline() {
  const [isOnline, setIsOnline] = React.useState(isServer || navigator.onLine)

  React.useEffect(() => {
    listeners.add(setIsOnline)
    return () => {
      listeners.delete(setIsOnline)
    }
  }, [])

  return isOnline
}
