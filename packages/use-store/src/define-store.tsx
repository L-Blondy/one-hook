import React from 'react'

type Unsubscribe = () => void

export type Storage<T> = {
  get: () => T
  set(updater: React.SetStateAction<T>): void
  subscribe: (listener: (state: T) => void) => Unsubscribe
}

export type DefineStoreOptions<TStorage extends Storage<any>> = {
  storage: TStorage
}

export function defineStore<TStorage extends Storage<any>>({
  storage,
}: DefineStoreOptions<TStorage>) {
  function useStore() {
    type State = TStorage extends Storage<infer T> ? T : never
    const [state, setState] = React.useState<State>(storage.get)
    React.useLayoutEffect(() => storage.subscribe(setState), [])
    return [state, storage.set] as [
      State,
      React.Dispatch<React.SetStateAction<State>>,
    ]
  }

  return [useStore, storage] as const
}
