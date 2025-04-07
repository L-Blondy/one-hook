import React from 'react'
import { useEventHandler } from '@1hook/use-event-handler'
import { isServer } from '@1hook/utils/is-server'

const listeners = new Set<(isVisible: boolean) => void>()

const getState = () => !document.hidden

const callAllListeners = () => listeners.forEach((l) => l(getState()))

export type UseDocumentVisibilityOptions = {
  /**
   * Executes when the visibility changes.
   */
  onChange?: (isVisible: boolean) => void
}

export function useDocumentVisibility({
  onChange,
}: UseDocumentVisibilityOptions = {}): boolean {
  const handleChange = useEventHandler(onChange)
  const [state, setState] = React.useState<boolean>(
    isServer ? true : getState(),
  )

  React.useEffect(() => {
    if (listeners.size === 0) {
      document.addEventListener('visibilitychange', callAllListeners, {
        passive: true,
      })
    }

    function listener(isVisible: boolean) {
      setState(isVisible)
      handleChange(isVisible)
    }

    listeners.add(listener)

    return () => {
      listeners.delete(listener)

      if (!listeners.size) {
        document.removeEventListener('resize', callAllListeners)
      }
    }
  }, [setState, handleChange])

  return state
}
