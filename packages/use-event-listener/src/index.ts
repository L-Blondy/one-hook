import React from 'react'
import { useEventHandler } from '@1hook/use-event-handler'
import { useIsHydrated } from '@1hook/use-is-hydrated'
import type {
  UseEventListenerTarget,
  UseEventListenerType,
  UseEventListenerCallback,
  UseEventListenerOptions,
  EventListenerService,
} from './types'
import { getEventListener } from './vanilla'
import type { MaybeRef } from '@1hook/utils/types'
export { isServer } from '@1hook/utils/is-server'

export type UseEventListenerReturn = {
  /**
   * Manually attach the event listener to the target.
   */
  add: () => void
  /**
   * Manually detach the event listener from the target.
   */
  remove: () => void
}

export function useEventListener<
  const Target extends UseEventListenerTarget,
  Type extends UseEventListenerType<Target>,
>(
  target: MaybeRef<Target | null | undefined | false>,
  type: Type,
  listener: UseEventListenerCallback<Target, Type>,
  { manual, capture, once, passive }: UseEventListenerOptions = {},
): UseEventListenerReturn {
  // targets passed as `ref.current` do no work properly,
  // they are undefined in the first effect.
  // To work around it we have to trigger a state update on mount
  useIsHydrated()
  const stableListener = useEventHandler(listener)
  const listenerServiceRef = React.useRef<EventListenerService<
    Target,
    Type
  > | null>(null)

  const add = React.useCallback(() => {
    listenerServiceRef.current?.add(stableListener)
  }, [stableListener])

  const remove = React.useCallback(() => {
    listenerServiceRef.current?.remove(stableListener)
  }, [stableListener])

  React.useEffect(() => {
    const _t = target ? ('current' in target ? target.current : target) : 0
    if (!_t) return
    const _listenerService = getEventListener(_t, type, {
      capture,
      once,
      passive,
    })
    listenerServiceRef.current = _listenerService
    !manual && add()
    return remove
  }, [target, type, manual, add, remove, capture, once, passive])

  return { add, remove }
}
