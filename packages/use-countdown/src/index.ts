import React from 'react'
import { useInterval } from '@rebase.io/use-interval'

type To = string | Date | null | undefined | false

type Transform<T> = (ms: number, to: To) => T

type State<T> = {
  ms: number
  value: T
  to: To
}

type UseCountdownOptions<T = number> = {
  to: To
  interval?: number
  transform?: (ms: number, to: To) => T
  onTick?: (value: T) => void
  onExpire?: () => void
  trackState?: boolean
  sync?: boolean
}

/**
 * https://crustack.vercel.app/hooks/use-countdown/
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
