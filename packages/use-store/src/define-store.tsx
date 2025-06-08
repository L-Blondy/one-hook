import React, { useContext, useLayoutEffect } from 'react'
import { memoryStorage } from './storage/memory'

type Unsubscribe = () => void

export type Storage<T> = {
  get: () => T | undefined
  set(updater: React.SetStateAction<T>): void
  subscribe: (listener: (state: T) => void) => Unsubscribe
}

export type StoreProviderProps<State> = {
  children: React.ReactNode
  initialState: State
}

export type DefineStoreOptions<State> = {
  storage?: Storage<State>
}

export function defineStore<State>({
  storage = memoryStorage<State>(),
}: DefineStoreOptions<State>) {
  const noContext: any = Symbol()
  const InitialStateCtx = React.createContext<State>(noContext)

  function Provider(props: StoreProviderProps<State>): React.ReactNode {
    return (
      <InitialStateCtx.Provider value={props.initialState}>
        {props.children}
      </InitialStateCtx.Provider>
    )
  }

  function useStore() {
    const initialState = useContext(InitialStateCtx)
    if (initialState === noContext) {
      throw new Error('Store Provider not found')
    }
    const [state, setState] = React.useState<State>(() => {
      const storeValue = storage.get()
      if (storeValue === undefined) {
        storage.set(initialState)
        return initialState
      }

      return storeValue
    })

    useLayoutEffect(() => storage.subscribe(setState), [])

    return [state, storage.set] as const
  }

  return [useStore, Provider, storage] as [
    useStore: typeof useStore,
    Provider: typeof Provider,
    store: NonNullable<typeof storage>,
  ]
}
