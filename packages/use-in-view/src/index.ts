import React from 'react'
import {
  useIntersectionObserver,
  type UseIntersectionObserverOptions,
  type UseIntersectionObserverReturn,
} from '@1hook/use-intersection-observer'
import { useEventHandler } from '@1hook/use-event-handler'

export type UseInViewOptions = UseIntersectionObserverOptions & {
  /**
   * Set to `false` to avoid tracking `inView` state for better performance
   *
   * @defaultValue true
   */
  trackState?: boolean
  onChange?: (inView: boolean) => void
}

export type UseInViewReturn = UseIntersectionObserverReturn & {
  /**
   * The visibility state of the element.
   */
  inView: boolean | undefined
}

/**
 * https://one-hook.vercel.app/docs
 */
export const useInView = (options: UseInViewOptions = {}): UseInViewReturn => {
  const [inView, setInView] = React.useState<boolean>()
  const onChange = useEventHandler(options.onChange)
  let prevIntersecting = React.useRef(inView)

  const observer = useIntersectionObserver((entry) => {
    ;(options.trackState ?? true) && setInView(entry.isIntersecting)
    if (entry.isIntersecting !== prevIntersecting.current) {
      onChange(entry.isIntersecting)
    }
    prevIntersecting.current = entry.isIntersecting
  }, options)

  return { ...observer, inView }
}
