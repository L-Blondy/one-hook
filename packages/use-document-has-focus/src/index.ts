import React from 'react'
import { useEventHandler } from '@1hook/use-event-handler'
import { isServer } from '@1hook/utils/is-server'

const listeners = new Set<(hasFocus: boolean) => void>()

const getState = () => document.hasFocus()

const callAllListeners = () => listeners.forEach((l) => l(getState()))

export type UseDocumentHasFocusOptions = {
  /**
   * Executes when the visibility changes.
   */
  onChange?: (hasFocus: boolean) => void
}

export function useDocumentHasFocus({
  onChange,
}: UseDocumentHasFocusOptions = {}): boolean {
  const handleChange = useEventHandler(onChange)
  const [state, setState] = React.useState<boolean>(
    isServer ? true : getState(),
  )

  React.useEffect(() => {
    if (listeners.size === 0) {
      window.addEventListener('focus', callAllListeners, { passive: true })
      window.addEventListener('blur', callAllListeners, { passive: true })
    }

    function listener(hasFocus: boolean) {
      setState(hasFocus)
      handleChange(hasFocus)
    }

    listeners.add(listener)

    return () => {
      listeners.delete(listener)

      if (!listeners.size) {
        window.removeEventListener('focus', callAllListeners)
        window.removeEventListener('blur', callAllListeners)
      }
    }
  }, [setState, handleChange])

  return state
}
