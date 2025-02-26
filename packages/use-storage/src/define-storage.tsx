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

  function useStorage<TKey extends StorageKey>(key: TKey) {
    const [state, setState] = React.useState<StorageValue<TKey>>(
      () => store.get(key)!,
    )

    useIsomorphicLayoutEffect(
      () =>
        emitter.on((channel, updater) => {
          channel === key && setState(updater)
        }),
      [key],
    )

    const set = React.useCallback(
      (updater: React.SetStateAction<Store[TKey]>) => {
        const value =
          typeof updater === 'function'
            ? (updater as any)(store.get(key))
            : updater
        store.set(key, value)
        service.set(key, value)
        emitter.emit(key as any, value)
      },
      [key],
    )

    return [state, set] as const
  }

  // Could be non-hook
  function useClearStorage() {
    return React.useCallback((keys: StorageKey[] = keysOf(config)) => {
      keys.forEach((key) => {
        service.remove(key)
        const value = service.get(key)
        store.set(key, value)
        emitter.emit(key as any, value)
      })
    }, [])
  }

  type OutputLocal = {
    useLocalStorage: typeof useStorage
    useClearLocalStorage: typeof useClearStorage
  }

  type OutputSession = {
    useSessionStorage: typeof useStorage
    useClearSessionStorage: typeof useClearStorage
  }

  type OutputType = TServiceOptions['type'] extends 'local'
    ? OutputLocal
    : OutputSession

  // assign to a typed variable before returning lets JSDocs work
  return options.type === 'local'
    ? ({
        useLocalStorage: useStorage,
        useClearLocalStorage: useClearStorage,
      } satisfies OutputLocal as OutputType)
    : ({
        useSessionStorage: useStorage,
        useClearSessionStorage: useClearStorage,
      } satisfies OutputSession as OutputType)
}
