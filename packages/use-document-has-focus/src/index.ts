import React from 'react'
import { useEventHandler } from '@1hook/use-event-handler'
import { isServer } from '@1hook/utils/is-server'
import { useIsHydrated } from '@1hook/use-is-hydrated'

const allListeners = new Set<(hasFocus: boolean) => void>()

if (!isServer) {
  window.addEventListener(
    'focus',
    () => {
      allListeners.forEach((l) => l(true))
    },
    { passive: true },
  )
  window.addEventListener(
    'blur',
    () => {
      allListeners.forEach((l) => l(false))
    },
    { passive: true },
  )
}

export type UseDocumentHasFocusOptions = {
  /**
   * Executes when the document focus changes.
   *
   * Does not execute when the document first loads.
   */
  onChange?: (hasFocus: boolean) => void
}

/**
 * https://one-hook.vercel.app/docs
 */
export function useDocumentHasFocus(
  options: UseDocumentHasFocusOptions = {},
): boolean {
  const onChange = useEventHandler(options.onChange)
  const [state, setState] = React.useState(isServer || document.hasFocus())

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
