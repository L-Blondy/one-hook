import React from 'react'
import { useIsomorphicLayoutEffect } from '@1hook/use-isomorphic-layout-effect'
import { useEventHandler } from '@1hook/use-event-handler'

export type Size = {
  width?: number
  height?: number
}

export type UseBoundingClientRectOptions = {
  /**
   * Set to `false` to avoid tracking inView state for better performance
   *
   * default: `true`
   */
  trackState?: boolean
  onChange?: (size: Size) => void
}

export function useSize({
  trackState = true,
  onChange,
}: UseBoundingClientRectOptions = {}) {
  const [target, ref] = React.useState<HTMLElement | null>(null)
  const [size, setSize] = React.useState<Size>({})
  const handleChange = useEventHandler(onChange)

  // Since the use case is basic, in order to reduce the bundle size
  // we use ResizeObserver instead of useResizeObserver
  useIsomorphicLayoutEffect(() => {
    if (!target) return
    const observer = new ResizeObserver((entries) => {
      const { inlineSize: width, blockSize: height } =
        entries[0]!.borderBoxSize[0]!
      trackState && setSize({ width, height })
      handleChange({ width, height })
    })
    observer.observe(target)
    return () => {
      setSize({})
      observer.disconnect()
    }
  }, [handleChange, trackState, target])

  return { ...size, ref, target }
}
