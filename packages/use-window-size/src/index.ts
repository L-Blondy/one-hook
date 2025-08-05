import React from 'react'
import { useEventHandler } from '@1hook/use-event-handler'
import { isServer } from '@1hook/utils/is-server'
import { useIsomorphicLayoutEffect } from '@1hook/use-isomorphic-layout-effect'
import { useIsHydrated } from '@1hook/use-is-hydrated'

type Size<TSSR extends boolean = false> = TSSR extends false
  ? {
      width: number
      height: number
    }
  : {
      width?: number
      height?: number
    }

const listeners = new Set<(size: Size) => void>()

if (!isServer) {
  window.addEventListener('resize', callAllListeners)
}

function callAllListeners() {
  listeners.forEach((l) =>
    l({
      width: window.innerWidth,
      height: window.innerHeight,
    }),
  )
}

export type DefineUseWindowSizeOptions<TSSR extends boolean> = {
  ssr?: TSSR
}

export type UseWindowSizeOptions = {
  /**
   * Set to `false` to avoid tracking the size state for better performance
   *
   * @default true
   */
  trackState?: boolean
  /**
   * Executes when the size changes, even if `trackState` is `false`.
   */
  onChange?: (size: Size) => void
}

export type UseWindowSizeReturn<TSSR extends boolean> = Size<TSSR>

/**
 * https://one-hook.vercel.app/docs
 */
export function defineUseWindowSize<TSSR extends boolean = false>(
  options: DefineUseWindowSizeOptions<TSSR> = {},
) {
  return function useWindowSize({
    trackState = true,
    onChange,
  }: UseWindowSizeOptions = {}): UseWindowSizeReturn<TSSR> {
    const handleChange = useEventHandler(onChange)
    const [size, setSize] = React.useState<Size | null>(
      isServer
        ? null
        : {
            width: window.innerWidth,
            height: window.innerHeight,
          },
    )

    useIsomorphicLayoutEffect(() => {
      function listener(size: Size) {
        trackState && setSize(size)
        handleChange(size)
      }

      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }, [setSize, trackState, handleChange])

    return (!useIsHydrated() && options.ssr ? {} : size) as Size<TSSR>
  }
}
