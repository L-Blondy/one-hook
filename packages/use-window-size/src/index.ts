import React from 'react'
import { useEventHandler } from '@rebase.io/use-event-handler'
import { isServer } from '@rebase.io/utils/is-server'
import { useIsomorphicLayoutEffect } from '@rebase.io/use-isomorphic-layout-effect'

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

/**
 * Tracks the inner dimensions of the browser window.
 *
 * https://crustack.vercel.app/hooks/use-window-size/
 */
export function useWindowSize<TSpa extends boolean = false>({
  spa = false as TSpa,
  trackState = true,
  onChange,
}: {
  spa?: TSpa
  onChange?: (size: Size<true>) => void
  trackState?: boolean
} = {}) {
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
