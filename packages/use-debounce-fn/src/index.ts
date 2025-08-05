import React from 'react'

export type UseDebounceFnReturn = {
  /**
   * Debounce a function execution.
   *
   * @param fn - The function to debounce.
   * @param delay - Override the default delay in milliseconds (optional).
   */
  debounce: (fn: () => any, delay?: number) => void
  /**
   * Cancel the debounce.
   */
  cancel: () => void
  /**
   * Whether a debounced call is pending.
   */
  isPending: boolean
}

/**
 * https://one-hook.vercel.app/docs
 */
export function useDebounceFn(defaultDelay: number): UseDebounceFnReturn {
  const timeoutRef = React.useRef<NodeJS.Timeout | number>(0)

  // use async transitions in React 19
  const [isPending, setIsPending] = React.useState(false)

  const cancel = React.useCallback(() => {
    setIsPending(false)
    clearTimeout(timeoutRef.current)
  }, [])

  const debounce = React.useCallback(
    (fn: () => any, delay: number = defaultDelay) => {
      cancel()
      if (!delay) {
        fn()
        return
      }
      setIsPending(true)
      timeoutRef.current = setTimeout(() => {
        setIsPending(false)
        fn()
      }, delay)
    },
    [cancel, defaultDelay],
  )

  // clear the debounce on unmount
  React.useEffect(() => cancel, [cancel])

  return { debounce, cancel, isPending }
}
