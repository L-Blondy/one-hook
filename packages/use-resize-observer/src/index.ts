import React from 'react'
import { useEventHandler } from '@one-stack/use-event-handler'
import { useIsomorphicLayoutEffect } from '@one-stack/use-isomorphic-layout-effect'
import { isServer } from '@one-stack/utils/is-server'

export type UseResizeObserverOptions = ResizeObserverOptions & {
  autoObserve?: boolean
}

export type UseResizeObserverCallback = (
  entry: ResizeObserverEntry,
  observer: ResizeObserver,
) => void

export const useResizeObserver = (
  callback: UseResizeObserverCallback,
  { autoObserve = true, box }: UseResizeObserverOptions = {},
) => {
  const stableCallback = useEventHandler(callback)
  const [target, ref] = React.useState<Element | null>(null)
  // since observing instantly triggers the observer callback
  // we want to prevent observing if the target is already observed
  const isObservingRef = React.useRef(false)

  // never changes
  const observer = React.useMemo(
    () =>
      isServer
        ? null
        : new ResizeObserver((entries, observer) => {
            stableCallback(entries[0]!, observer)
          }),
    [stableCallback],
  )

  const observe = React.useCallback(() => {
    target && !isObservingRef.current && observer?.observe(target, { box })
    isObservingRef.current = true
  }, [observer, target, box])

  const unobserve = React.useCallback(() => {
    target && observer?.unobserve(target)
    isObservingRef.current = false
  }, [observer, target])

  useIsomorphicLayoutEffect(() => {
    autoObserve && observe()
    return unobserve
  }, [stableCallback, target, observe, unobserve, autoObserve])

  return { observe, unobserve, ref, target }
}
