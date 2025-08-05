import React from 'react'
import { useInterval } from '@1hook/use-interval'

type To = string | Date | null | undefined | false

type Transform<T> = (ms: number, to: To) => T

type State<T> = {
  ms: number
  value: T
  to: To
}

export type UseCountdownOptions<T = number> = {
  /**
   * The Date to countdown to.
   *
   * Pass a falsy value to pause/disable the countdown.
   *
   * @remarks `Date | string | null | undefined | false`
   */
  to: To
  /**
   * The interval in milliseconds between each tick.
   *
   * @defaultValue 1000
   */
  interval?: number
  /**
   * Transform the value returned by the `onTick` callback.
   */
  transform?: (ms: number, to: To) => T
  /**
   * Callback that receives the transformed value (returned by the `transform` option).
   *
   * Last called when the remaining time reaches 0 or less.
   */
  onTick?: (value: T) => void
  /**
   * Called when the remaining time reaches 0 or less.
   */
  onExpire?: () => void
  /**
   * Set to `false` to avoid tracking the state for better performance.
   *
   * @defaultValue true
   */
  trackState?: boolean
  /**
   * Set to `true` to synchronize all countdowns that share the same interval.
   *
   * @defaultValue false
   */
  sync?: boolean
}

/**
 * https://one-hook.vercel.app/docs
 */
export function useCountdown<T = number>({
  to,
  transform = (ms) => ms as T,
  onExpire,
  onTick,
  interval = 1000,
  trackState = true,
  sync,
}: UseCountdownOptions<T>): T {
  /**
   * Avoid computing the values on every render by saving everything into a state
   */
  const [state, setState] = React.useState<State<T>>(() =>
    resolveState(to, transform),
  )

  if (String(to) !== String(state.to)) {
    setState(resolveState(to, transform))
  }

  useInterval(
    () => {
      const newState = resolveState(to, transform)
      onTick?.(newState.value)
      if (newState.ms) {
        trackState && setState(newState)
      } else {
        // always set the state to "done" and stop the interval
        setState(newState)
        onExpire?.()
      }
    },
    !!state.to && !!state.ms && interval,
    { sync },
  )

  return state.value
}

function resolveState<T>(to: To, transform: Transform<T>): State<T> {
  const ms = to ? Math.max(0, new Date(to).getTime() - Date.now()) : 0
  return {
    ms,
    value: transform(ms, to),
    to,
  }
}
