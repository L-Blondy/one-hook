import React from 'react'
import { isServer } from '@1hook/utils/is-server'
import { useIsHydrated } from '@1hook/use-is-hydrated'
import { noop } from '@1hook/utils/noop'

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
   *
   * Does not execute when the document first loads.
   */
  onChange?: (isVisible: boolean) => void
  /**
   * Set to `false` to avoid tracking the state for better performance.
   *
   * The returned value never updates, use the `onChange` callback instead.
   *
   * @defaultValue true
   */
  trackState?: boolean
}

/**
 * https://one-hook.vercel.app/docs
 */
export function useDocumentVisibility(
  options: UseDocumentVisibilityOptions = {},
): boolean {
  const onChange = React.useEffectEvent(options.onChange ?? noop)
  const trackState = options.trackState ?? true
  const [state, setState] = React.useState(isServer || !document.hidden)

  React.useEffect(() => {
    if (trackState) {
      allListeners.add(setState)
      // resync the state: visibility changes are not tracked while `trackState` is `false`
      setState(!document.hidden)
    }
    allListeners.add(onChange)

    return () => {
      allListeners.delete(setState)
      allListeners.delete(onChange)
    }
  }, [trackState])

  return !useIsHydrated() || state
}
