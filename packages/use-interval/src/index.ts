import React from 'react'
import { set, clear, type IntervalToken } from './vanilla'

export type UseIntervalOptions = {
  /**
   * Set to `true` to execute the callback immediately, without waiting for the first tick.
   *
   * @default false
   */
  leading?: boolean
  /**
   * Set to `true` to synchronize with other intervals that share the same delay.
   *
   * @default false
   */
  sync?: boolean
}

export type UseIntervalReturn = {
  /**
   * `true` if the interval is running, indicating that the callback execution is scheduled.
   */
  isPending: boolean
  /**
   * Cancels the interval. Achieves the same result as setting the delay to `null`
   */
  cancel: () => void
  /**
   * Restart the interval. Also cancels the current interval.
   */
  reset: () => void
}

/**
 * https://one-hook.vercel.app/docs
 */
export function useInterval(
  callback: () => any,
  delay: number | null | false | undefined,
  { leading, sync }: UseIntervalOptions = {},
): UseIntervalReturn {
  const [isPending, setIsPending] = React.useState(isEnabled(delay))
  const cb = React.useEffectEvent(callback)
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
  }, [delay, leading, sync])

  React.useEffect(() => {
    reset()
    return cancel
  }, [reset, cancel])

  return { isPending, cancel, reset }
}

const isEnabled = (delay: number | null | false | undefined): delay is number =>
  typeof delay === 'number'
