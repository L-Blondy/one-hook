import React from 'react'

export type UseTimeoutReturn = {
  /**
   * Whether a timeout is pending.
   */
  isPending: boolean
  /**
   * Cancel the timeout.
   */
  cancel: () => void
  /**
   * Reset the timeout.
   *
   * Cancels the current timeout and sets a new one.
   */
  reset: () => void
}

/**
 * https://one-hook.vercel.app/docs
 */
export const useTimeout = (
  callback: () => any,
  delay: number | null | false | undefined,
): UseTimeoutReturn => {
  const [isPending, setIsPending] = React.useState(isEnabled(delay))
  const cb = React.useEffectEvent(callback)
  const timeoutRef = React.useRef<NodeJS.Timeout | number>(0)

  const cancel = React.useCallback(() => {
    clearTimeout(timeoutRef.current)
    setIsPending(false)
  }, [])

  const reset = React.useCallback(() => {
    if (isEnabled(delay)) {
      clearTimeout(timeoutRef.current)
      setIsPending(true)
      timeoutRef.current = setTimeout(() => {
        setIsPending(false)
        cb()
      }, delay)
    }
  }, [delay])

  React.useEffect(() => {
    reset()
    return cancel
  }, [reset, cancel])

  return { isPending, cancel, reset }
}

const isEnabled = (delay: number | null | false | undefined) =>
  typeof delay === 'number'
