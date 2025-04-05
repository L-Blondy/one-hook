import React from 'react'

export type UseThrottleFnOptions = {
  /**
   * Schedule the last call.
   *
   * @default true
   */
  trailing?: boolean
}

export type UseThrottleFnReturn = {
  /**
   * Throttle a function execution.
   *
   * @param callback - The function to throttle.
   * @param interval - Override the default interval in milliseconds (optional).
   */
  throttle: (callback: () => any, interval?: number) => void
  /**
   * Cancel the throttle.
   */
  cancel: () => void
  /**
   * Whether a throttled call is pending.
   */
  isPending: boolean
}

export function useThrottleFn(
  defaultInterval: number,
  { trailing = true }: UseThrottleFnOptions = {},
): UseThrottleFnReturn {
  const [isPending, setIsPending] = React.useState(false)
  const lastCallTimestampRef = React.useRef(0)
  const timeoutRef = React.useRef<NodeJS.Timeout | number>(0)

  const cancel = React.useCallback(() => {
    setIsPending(false)
    clearTimeout(timeoutRef.current)
  }, [])

  const throttle = React.useCallback(
    (callback: () => any, interval: number = defaultInterval) => {
      cancel()
      const now = Date.now()
      const elapsed = now - lastCallTimestampRef.current
      const remainingMs = Math.max(0, interval - elapsed)

      if (!remainingMs) {
        // call now
        cancel()
        lastCallTimestampRef.current = now
        callback()
      } else if (trailing) {
        // schedule the next call
        setIsPending(true)
        timeoutRef.current = setTimeout(() => {
          setIsPending(false)
          lastCallTimestampRef.current = Date.now()
          callback()
        }, interval)
      }
    },
    [cancel, defaultInterval, trailing],
  )

  // clear the debounce on unmount
  React.useEffect(() => cancel, [cancel])

  return { throttle, cancel, isPending }
}
