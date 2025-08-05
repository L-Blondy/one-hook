import React from 'react'
import { useEventHandler } from '@1hook/use-event-handler'
import { isServer } from '@1hook/utils/is-server'
import { useIsHydrated } from '@1hook/use-is-hydrated'

const allListeners = new Set<(isVisible: boolean) => void>()

if (!isServer) {
  document.addEventListener(
    'visibilitychange',
    () => {
      allListeners.forEach((l) => l(!document.hidden))
    },
    { passive: true },
  )
}

export type UseDocumentVisibilityOptions = {
  /**
   * Executes when the visibility changes.
   */
  onChange?: (isVisible: boolean) => void
}

/**
 * https://one-hook.vercel.app/docs
 */
export function useDocumentVisibility(
  options: UseDocumentVisibilityOptions = {},
): boolean {
  const onChange = useEventHandler(options.onChange)
  const [state, setState] = React.useState(isServer || !document.hidden)

  React.useEffect(() => {
    allListeners.add(setState)
    allListeners.add(onChange)

    return () => {
      allListeners.delete(setState)
      allListeners.delete(onChange)
    }
  }, [onChange])

  return !useIsHydrated() || state
}
