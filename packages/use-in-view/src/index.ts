import React from 'react'
import { usePrevious } from '@one-stack/use-previous'
import {
  useIntersectionObserver,
  type UseIntersectionObserverOptions,
  type UseIntersectionObserverReturn,
} from '@one-stack/use-intersection-observer'
import { useEventHandler } from '@one-stack/use-event-handler'

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

  const prevTarget = usePrevious(observer.target)

  return {
    ...observer,
    // set to false if the target unmounts
    inView: prevTarget && !observer.target ? false : inView,
  }
}
