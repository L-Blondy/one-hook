import React from 'react'
import { useEventHandler } from '@1hook/use-event-handler'
import { isServer } from '@1hook/utils/is-server'
import { useIsomorphicLayoutEffect } from '@1hook/use-isomorphic-layout-effect'

type Size<TSpa extends boolean = false> = TSpa extends true
  ? {
      width: number
      height: number
    }
  : {
      width?: number
      height?: number
    }

const listeners = new Set<(size: Size<true>) => void>()

const callAllListeners = () =>
  listeners.forEach((l) =>
    l({
      width: window.innerWidth,
      height: window.innerHeight,
    }),
  )

export type DefineUseWindowSizeOptions<TSpa extends boolean> = {
  spa?: TSpa
}

export type UseWindowSizeOptions = {
  onChange?: (size: Size<true>) => void
  trackState?: boolean
}

export type UseWindowSizeReturn<TSpa extends boolean> = Size<TSpa>

export function defineUseWindowSize<TSpa extends boolean = false>({
  spa,
}: DefineUseWindowSizeOptions<TSpa> = {}) {
  return function useWindowSize({
    trackState = true,
    onChange,
  }: UseWindowSizeOptions = {}): UseWindowSizeReturn<TSpa> {
    const handleChange = useEventHandler(onChange)
    const [size, setSize] = React.useState<Size>({
      width: spa && !isServer ? window.innerWidth : undefined,
      height: spa && !isServer ? window.innerHeight : undefined,
    })

    useIsomorphicLayoutEffect(() => {
      if (!spa) {
        const size = {
          width: window.innerWidth,
          height: window.innerHeight,
        }
        setSize(size)
        handleChange(size)
      }
    }, [spa, handleChange])

    React.useEffect(() => {
      if (listeners.size === 0) {
        window.addEventListener('resize', callAllListeners, { passive: true })
      }

      function listener(size: Size<true>) {
        trackState && setSize(size)
        handleChange(size)
      }

      listeners.add(listener)

      return () => {
        listeners.delete(listener)

        if (!listeners.size) {
          window.removeEventListener('resize', callAllListeners)
        }
      }
    }, [setSize, trackState, handleChange])

    return size as Size<TSpa>
  }
}
