import React from 'react'
import { useIsomorphicLayoutEffect } from '@1hook/use-isomorphic-layout-effect'
import { useEventHandler } from '@1hook/use-event-handler'

export type Size = {
  /**
   * The width of the element.
   */
  width?: number
  /**
   * The height of the element.
   */
  height?: number
}

export type UseSizeOptions = {
  /**
   * Set to `false` to avoid tracking the state for better performance
   *
   * @default true
   */
  trackState?: boolean
  /**
   * Called with `{ width, height }` when the ResizeObserver is triggered, even if `trackState` is `false`.
   */
  onChange?: (size: Size) => void
}

export type UseSizeReturn = Size & {
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

export function useSize({
  trackState = true,
  onChange,
}: UseSizeOptions = {}): UseSizeReturn {
  const [target, ref] = React.useState<Element | null>(null)
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
