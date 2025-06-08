import React, { useLayoutEffect } from 'react'

type Unsubscribe = () => void

export type Storage<T> = {
  get: () => T
  set(updater: React.SetStateAction<T>): void
  subscribe: (listener: (state: T) => void) => Unsubscribe
}

export type StoreProviderProps<State> = {
  children: React.ReactNode
  initialState: State
}

export type DefineStoreOptions<State> = {
  storage: Storage<State>
}

export type DefineStoreReturn<State> = [
  useStore: () => readonly [
    State,
    (updater: React.SetStateAction<State>) => void,
  ],
  store: Storage<State>,
]

export function defineStore<State>({
  storage,
}: DefineStoreOptions<State>): DefineStoreReturn<State> {
  function useStore() {
    const [state, setState] = React.useState<State>(storage.get)
    useLayoutEffect(() => storage.subscribe(setState), [])
    return [state, storage.set] as const
  }

  return [useStore, storage]
}
