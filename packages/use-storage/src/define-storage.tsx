import React from 'react'
import {
  createStorageService,
  type ServiceOptions,
  type StorageConfig,
} from './vanilla'
import type { KeyOf } from '@one-stack/utils/types'
import { createEmitter } from '@one-stack/utils/emitter'
import { keysOf } from '@one-stack/utils/keys-of'
import { useIsomorphicLayoutEffect } from '@one-stack/use-isomorphic-layout-effect'
import type { ValidatorOutput } from '@one-stack/utils/validate'

export function defineStorage<
  TConfig extends Record<string, StorageConfig>,
  TServiceOptions extends ServiceOptions,
>(config: TConfig, options: TServiceOptions) {
  type StorageKey = KeyOf<TConfig>
  type StorageValue<TKey extends StorageKey> = ValidatorOutput<
    TConfig[TKey]['validate']
  >
  type Store = {
    [Key in StorageKey]: StorageValue<Key>
  }

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

  function get<TKey extends StorageKey>(key: TKey): StorageValue<TKey> {
    return store.get(key)!
  }

  function set<TKey extends StorageKey>(
    key: TKey,
    updater: React.SetStateAction<Store[TKey]>,
  ) {
    const value =
      typeof updater === 'function' ? (updater as any)(store.get(key)) : updater
    store.set(key, value)
    service.set(key, value)
    emitter.emit(key as any, value)
  }

  function clear(keys: StorageKey[] = keysOf(config)) {
    keys.forEach((key) => {
      service.remove(key)
      const value = service.get(key)
      store.set(key, value)
      emitter.emit(key as any, value)
    })
  }

  function useStorage<TKey extends StorageKey>(key: TKey) {
    type State = {
      value: StorageValue<TKey>
      set: (updater: React.SetStateAction<StorageValue<TKey>>) => void
      clear: () => void
      get: () => StorageValue<TKey>
    }

    const [state, setState] = React.useState<State>(() => ({
      value: get(key),
      set: (updater) => set(key, updater),
      clear: () => clear([key]),
      get: () => get(key),
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

  const Storage = { get, set, clear }

  return [useStorage, Storage] as const
}
