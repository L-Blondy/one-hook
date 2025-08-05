import React from 'react'
import { createEmitter } from '@1hook/utils/emitter'
import { useIsomorphicLayoutEffect } from '@1hook/use-isomorphic-layout-effect'

export type DefineGlobalStateConfig<State> = {
  initialState: State
}

/**
 * https://one-hook.vercel.app/docs
 */
export function defineGlobalState<State>(
  config: DefineGlobalStateConfig<State>,
) {
  let store = { v: config.initialState }
  const emitter = createEmitter<React.SetStateAction<State>>()

  function set(updater: React.SetStateAction<State>) {
    const next =
      typeof updater === 'function' ? (updater as any)(store.v) : updater
    store.v = next
    emitter.emit(next)
  }

  function useGlobalState() {
    const [state, setState] = React.useState<State>(store.v)

    useIsomorphicLayoutEffect(() => emitter.on(setState), [])

    return [state, set] as const
  }

  return [useGlobalState, set] as [
    useGlobalState: typeof useGlobalState,
    set: typeof set,
  ]
}
