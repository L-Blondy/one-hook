import React from 'react'
import { useEventHandler } from '@1hook/use-event-handler'
import type { AnyFunction } from '@1hook/utils/types'

export const useTimeout = (
  callback: AnyFunction,
  delay: number | null | false | undefined,
) => {
  const [isPending, setIsPending] = React.useState(isEnabled(delay))
  const cb = useEventHandler(callback)
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
  }, [delay, cb])

  React.useEffect(() => {
    reset()
    return cancel
  }, [reset, cancel])

  return { isPending, cancel, reset }
}

const isEnabled = (delay: number | null | false | undefined) =>
  typeof delay === 'number'
