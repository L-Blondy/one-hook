import React from 'react'
import { useEventHandler } from '@rebase.io/use-event-handler'
import {
  getIntersectionObserver,
  type Callback,
  type IntersectionObserverInstance,
} from './vanilla'

export type UseIntersectionObserverCallback = Callback

export type UseIntersectionObserverOptions = IntersectionObserverInit & {
  autoObserve?: boolean
}

export const useIntersectionObserver = (
  callback: UseIntersectionObserverCallback,
  {
    autoObserve = true,
    root,
    rootMargin,
    threshold,
  }: UseIntersectionObserverOptions = {},
) => {
  const instanceRef = React.useRef<IntersectionObserverInstance | null>(null)
  const stableCallback = useEventHandler(callback)
  const [target, ref] = React.useState<Element | null>(null)

  const observe = React.useCallback(() => {
    target && instanceRef.current?.observe(target, stableCallback)
  }, [stableCallback, target])

  const unobserve = React.useCallback(() => {
    instanceRef.current?.unobserve(target, stableCallback)
  }, [stableCallback, target])

  React.useEffect(() => {
    if (!target) return
    instanceRef.current = getIntersectionObserver({
      root,
      rootMargin,
      threshold,
    })
    autoObserve && observe()
    return unobserve
  }, [autoObserve, observe, root, rootMargin, target, threshold, unobserve])

  return { observe, unobserve, ref, target }
}
