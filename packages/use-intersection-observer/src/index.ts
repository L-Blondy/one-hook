import React from 'react'
import { useEventHandler } from '@1hook/use-event-handler'
import { useLatestRef } from '@1hook/use-latest-ref'
import {
  getIntersectionObserver,
  type Listener,
  type IntersectionObserverInstance,
} from './vanilla'
import { getInstanceId } from './utils'

export type UseIntersectionObserverCallback = Listener

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
  ref: React.Dispatch<React.SetStateAction<Element | null>>
  /**
   * The observed element.
   */
  target: Element | null
}

/**
 * https://one-hook.vercel.app/docs
 */
export const useIntersectionObserver = (
  callback: UseIntersectionObserverCallback,
  options: UseIntersectionObserverOptions = {},
) => {
  const instanceRef = React.useRef<IntersectionObserverInstance | null>(null)
  const stableCallback = useEventHandler(callback)
  const [target, ref] = React.useState<Element | null>(null)
  const optionsRef = useLatestRef(options)
  const instanceId = getInstanceId(options)

  const observe = React.useCallback(() => {
    target && instanceRef.current?.observe(target, stableCallback)
  }, [stableCallback, target])

  const unobserve = React.useCallback(() => {
    instanceRef.current?.unobserve(target, stableCallback)
  }, [stableCallback, target])

  React.useEffect(() => {
    if (!target) return
    instanceRef.current = getIntersectionObserver(optionsRef.current)
    ;(optionsRef.current.autoObserve ?? true) && observe()
    return () => {
      unobserve()
      instanceRef.current = null
    }
  }, [observe, target, unobserve, optionsRef, instanceId])

  return { observe, unobserve, ref, target }
}
