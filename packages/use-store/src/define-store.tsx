import React, { useContext, useLayoutEffect } from 'react'
import { createInMemoryStore } from './in-memory'

type Unsubscribe = () => void

export type Store<T> = {
  get: () => T | undefined
  set(updater: React.SetStateAction<T>): void
  subscribe: (listener: (state: T) => void) => Unsubscribe
}

export type StoreProviderProps<State> = {
  children: React.ReactNode
  initialState: State
}

export function defineStore<State>(store?: Store<State>) {
  store ??= createInMemoryStore<State>()
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
      const storeValue = store!.get()
      if (storeValue === undefined) {
        store!.set(initialState)
        return initialState
      }

      return storeValue
    })

    useLayoutEffect(() => store!.subscribe(setState), [])

    return [state, store!.set] as const
  }

  return [useStore, Provider, store] as [
    useStore: typeof useStore,
    Provider: typeof Provider,
    store: NonNullable<typeof store>,
  ]
}
