import React from 'react'

export function useDebounceFn(defaultDelay: number) {
  const timeoutRef = React.useRef<NodeJS.Timeout | number>(0)

  // use async transitions in React 19
  const [isPending, setIsPending] = React.useState(false)

  const cancel = React.useCallback(() => {
    setIsPending(false)
    clearTimeout(timeoutRef.current)
  }, [])

  const debounce = React.useCallback(
    (callback: () => any, delay: number = defaultDelay) => {
      cancel()
      if (!delay) {
        callback()
        return
      }
      setIsPending(true)
      timeoutRef.current = setTimeout(() => {
        setIsPending(false)
        callback()
      }, delay)
    },
    [cancel, defaultDelay],
  )

  // clear the debounce on unmount
  React.useEffect(() => cancel, [cancel])

  return { debounce, cancel, isPending }
}
