import React from 'react'
import { usePrevious } from '@1hook/use-previous'
import {
  useIntersectionObserver,
  type UseIntersectionObserverOptions,
} from '@1hook/use-intersection-observer'
import { useEventHandler } from '@1hook/use-event-handler'

export type UseInViewOptions = UseIntersectionObserverOptions & {
  /**
   * Set to `false` to avoid tracking inView state for better performance
   *
   * default: `true`
   */
  trackState?: boolean
  onChange?: (inView: boolean) => void
}

export const useInView = (options: UseInViewOptions = {}) => {
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
