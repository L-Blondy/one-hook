import React from 'react'
import { useDocumentVisibility } from '@1hook/use-document-visibility'
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
   * When a function, it is called on mount and then on each tick.
   *
   * @defaultValue 1000
   */
  interval?: number | ((remainingMs: number) => number)
  /**
   * Transform the value returned by the `onTick` callback.
   *
   * When a function, it is called on mount and then on each tick.
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
  // a ref dedupes the terminal tick even before the "done" state is committed,
  // e.g. when a wake tick races the expiring interval tick
  const hasExpiredRef = React.useRef(false)

  if (String(to) !== String(state.to)) {
    hasExpiredRef.current = false
    setState(resolveState(to, transform))
  }

  const tick = () => {
    const newState = resolveState(to, transform)
    if (newState.ms) {
      onTick?.(newState.value)
      trackState && setState(newState)
    } else {
      // always set the state to "done" and stop the interval
      setState(newState)
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true
        onTick?.(newState.value)
        onExpire?.()
      }
    }
    return newState
  }

  const { reset } = useInterval(
    tick,
    !!state.to &&
      !!state.ms &&
      (typeof interval === 'function' ? interval(state.ms) : interval),
    { sync },
  )

  useDocumentVisibility({
    // the visibility state is not consumed, avoid rerendering on visibility changes
    trackState: false,
    onChange(isVisible) {
      // `state.ms` is 0 when the countdown is paused or already expired
      if (!isVisible || !state.ms) return
      // restart the interval only if the wake tick did not expire the countdown
      if (tick().ms) reset()
    },
  })

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
