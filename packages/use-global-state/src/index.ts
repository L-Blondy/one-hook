import React from 'react'
import { createEmitter } from '@one-stack/utils/emitter'
import { useIsomorphicLayoutEffect } from '@one-stack/use-isomorphic-layout-effect'

export type DefineGlobalStateConfig<State> = {
  initialState: State
}

export function defineGlobalState<State>(
  config: DefineGlobalStateConfig<State>,
) {
  let store = { v: config.initialState }
  const emitter = createEmitter<{ '': React.SetStateAction<State> }>()

  function set(updater: React.SetStateAction<State>) {
    const next =
      typeof updater === 'function' ? (updater as any)(store.v) : updater
    store.v = next
    emitter.emit('', next)
  }

  return [
    () => {
      const [state, setState] = React.useState<State>(store.v)

      useIsomorphicLayoutEffect(
        () => emitter.on((_, updater) => setState(updater)),
        [],
      )

      return [state, set] as const
    },
    set,
  ] as const
}
