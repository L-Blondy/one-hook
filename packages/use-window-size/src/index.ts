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

// The live size, one object per size, shared by every hook: React compares
// snapshots by identity, so a resize that keeps the size renders nothing.
let snapshot: Size | null = null
function getSnapshot(): Size | null {
  if (isServer) return null
  const width = window.innerWidth
  const height = window.innerHeight
  if (
    snapshot === null ||
    snapshot.width !== width ||
    snapshot.height !== height
  ) {
    snapshot = { width, height }
  }
  return snapshot
}

if (!isServer) {
  window.addEventListener('resize', callAllListeners)
}

function callAllListeners() {
  const size = getSnapshot()
  if (size) listeners.forEach((l) => l(size))
}

function subscribe(listener: (size: Size) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const subscribeNone = () => noop

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
    // A store, not transition state: React renders a resize before the next
    // paint, so layout that follows the size is never a frame behind.
    const live = React.useSyncExternalStore(
      trackState ? subscribe : subscribeNone,
      getSnapshot,
      getSnapshot,
    )
    // The size last tracked, which `trackState: false` keeps.
    const [frozen, setFrozen] = React.useState(live)
    if (trackState && frozen !== live) setFrozen(live)

    React.useLayoutEffect(() => {
      const size = getSnapshot()
      if (size) onChangeProp(size) // at least once
      return subscribe((size) => onChangeProp(size))
    }, [trackState])

    const size = trackState ? live : frozen
    return (!useIsHydrated() && options.ssr ? {} : size) as Size<TSSR>
  }
}
