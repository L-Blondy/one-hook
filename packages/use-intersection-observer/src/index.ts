import React from 'react'
import { useEventHandler } from '@1hook/use-event-handler'
import {
  getIntersectionObserver,
  type Callback,
  type IntersectionObserverInstance,
} from './vanilla'

export type UseIntersectionObserverCallback = Callback

export type UseIntersectionObserverOptions = IntersectionObserverInit & {
  /**
   * Automatically observe the target element.
   *
   * @default true
   */
  autoObserve?: boolean
}

export type UseIntersectionObserverReturn = {
  /**
   * Manually starts observing the element.
   */
  observe: () => void
  /**
   * Manually stops observing the element.
   */
  unobserve: () => void
  /**
   * A callback ref to pass to the element to observe.
   *
   * @remarks `Function`
   */
  ref: React.Dispatch<React.SetStateAction<HTMLElement | null>>
  /**
   * The observed element.
   */
  target: HTMLElement | null
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
  const [target, ref] = React.useState<HTMLElement | null>(null)

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
