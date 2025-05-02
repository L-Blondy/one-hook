import React from 'react'
import {
  createStorageService,
  type StorageServiceOptions,
  type StorageValidator,
} from './vanilla'
import type { Defined, KeyOf } from '@1hook/utils/types'
import { createEmitter } from '@1hook/utils/emitter'
import { keysOf } from '@1hook/utils/keys-of'
import { useIsomorphicLayoutEffect } from '@1hook/use-isomorphic-layout-effect'
import type { ValidatorOutput } from '@1hook/utils/validate'

export function defineStorage<
  TConfig extends Record<string, StorageValidator>,
  TServiceOptions extends StorageServiceOptions,
>(config: TConfig, options: TServiceOptions) {
  type StorageKey = KeyOf<TConfig>
  type StorageValue<TKey extends StorageKey> = ValidatorOutput<TConfig[TKey]>
  type TUpdater<TKey extends StorageKey> =
    | Defined<StorageValue<TKey>>
    | ((value: StorageValue<TKey>) => Defined<StorageValue<TKey>>)

  const service = createStorageService(config, options)
  const emitter = createEmitter()

  const store = new Map<StorageKey, StorageValue<StorageKey>>(
    keysOf(config as Record<StorageKey, any>).map((key) => [
      key,
      service.get(key),
    ]),
  )

  window.addEventListener('storage', ({ key }: { key: any }) => {
    if (keysOf(config).includes(key)) {
      const value = service.get(key)
      store.set(key, value)
      emitter.emit(key, value)
    }
  })

  const Storage = {
    get<TKey extends StorageKey>(key: TKey): StorageValue<TKey> {
      return store.get(key)!
    },
    set<TKey extends StorageKey>(key: TKey, updater: TUpdater<TKey>) {
      const value =
        typeof updater === 'function'
          ? (updater as any)(store.get(key))
          : updater
      store.set(key, value)
      service.set(key, value)
      emitter.emit(key as any, value)
    },
    clear(keys: StorageKey[] = keysOf(config)) {
      keys.forEach((key) => {
        service.remove(key)
        const value = service.get(key)
        store.set(key, value)
        emitter.emit(key as any, value)
      })
    },
  }

  function useStorage<TKey extends StorageKey>(key: TKey) {
    type State = {
      value: StorageValue<TKey>
      set: (updater: TUpdater<TKey>) => void
      clear: () => void
      get: () => StorageValue<TKey>
    }

    const [state, setState] = React.useState<State>(() => ({
      value: Storage.get(key),
      set: (updater) => Storage.set(key, updater),
      clear: () => Storage.clear([key]),
      get: () => Storage.get(key),
    }))

    useIsomorphicLayoutEffect(
      () =>
        emitter.on((channel, updater) => {
          channel === key &&
            setState((prev) => ({
              ...prev,
              value:
                typeof updater === 'function' ? updater(prev.value) : updater,
            }))
        }),
      [key],
    )

    return state
  }

  return [useStorage, Storage] as const
}
