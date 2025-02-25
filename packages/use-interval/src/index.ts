import React from 'react'
import { useEventHandler } from '@one-stack/use-event-handler'
import type { AnyFunction } from '@one-stack/utils/types'
import { set, clear, type IntervalToken } from './vanilla'

export type UseIntervalOptions = {
  leading?: boolean
  sync?: boolean
}

export function useInterval(
  callback: AnyFunction,
  delay: number | null | false | undefined,
  { leading, sync }: UseIntervalOptions = {},
) {
  const [isPending, setIsPending] = React.useState(isEnabled(delay))
  const cb = useEventHandler(callback)
  const tokenRef = React.useRef<IntervalToken>(0)

  const cancel = React.useCallback(() => {
    clear(tokenRef.current)
    setIsPending(false)
  }, [])

  const reset = React.useCallback(() => {
    if (isEnabled(delay)) {
      clear(tokenRef.current)
      setIsPending(true)
      if (leading) cb()
      tokenRef.current = set(
        () => {
          setIsPending(false)
          cb()
        },
        delay,
        sync,
      )
    }
  }, [delay, cb, leading, sync])

  React.useEffect(() => {
    reset()
    return cancel
  }, [reset, cancel])

  return { isPending, cancel, reset }
}

const isEnabled = (delay: number | null | false | undefined): delay is number =>
  typeof delay === 'number'
