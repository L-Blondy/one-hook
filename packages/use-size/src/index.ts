import React from 'react'
import { noop } from '@1hook/utils/noop'

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
   *
   * Executes at least once when the target is observed
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

/**
 * https://one-hook.vercel.app/docs
 */
export function useSize({
  trackState = true,
  onChange = noop,
}: UseSizeOptions = {}): UseSizeReturn {
  const [target, ref] = React.useState<Element | null>(null)
  const [size, setSize] = React.useState<Size>({})
  const handleChange = React.useEffectEvent(onChange)

  // Since the use case is basic, in order to reduce the bundle size
  // we use ResizeObserver instead of useResizeObserver
  React.useLayoutEffect(() => {
    if (!target) return
    const observer = new ResizeObserver((entries) => {
      const { inlineSize: width, blockSize: height } =
        entries[0]!.borderBoxSize[0]!
      trackState && React.startTransition(() => setSize({ width, height }))
      handleChange({ width, height })
    })
    observer.observe(target)
    return () => {
      setSize({})
      observer.disconnect()
    }
  }, [trackState, target])

  return { ...size, ref, target }
}
