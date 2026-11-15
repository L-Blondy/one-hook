import React from 'react'
import { isServer } from '@1hook/utils/is-server'
import { useIsHydrated } from '@1hook/use-is-hydrated'
import { noop } from '@1hook/utils/noop'

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

const getSize = () => ({ width: window.innerWidth, height: window.innerHeight })

if (!isServer) {
  window.addEventListener('resize', callAllListeners)
}

function callAllListeners() {
  listeners.forEach((l) => l(getSize()))
}

type Store = { size: Size | null; notify: () => void }

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
   * Executes at least once, and when the size changes, even if `trackState` is `false`.
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
    const onChangeProp = React.useEffectEvent(onChange ?? noop)
    // Each hook's own store, read by React during render: a resize renders
    // before the next paint, where transition state would render after it.
    const [store] = React.useState<Store>(() => ({
      size: isServer ? null : getSize(),
      notify: noop,
    }))
    const subscribe = React.useCallback(
      (notify: () => void) => {
        store.notify = notify
        return () => {
          store.notify = noop
        }
      },
      [store],
    )
    const getSnapshot = React.useCallback(() => store.size, [store])
    const size = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

    React.useLayoutEffect(() => {
      function listener(size: Size) {
        if (trackState) {
          store.size = size
          store.notify()
        }
        onChangeProp(size)
      }
      onChangeProp(getSize()) // at least once
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    }, [store, trackState])

    return (!useIsHydrated() && options.ssr ? {} : size) as Size<TSSR>
  }
}
