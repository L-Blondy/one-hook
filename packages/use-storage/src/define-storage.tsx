import React from 'react'
import { createStorageService, type StorageServiceOptions } from './vanilla'
import type { KeyOf } from '@rebase.io/utils/types'
import { createEmitter } from '@rebase.io/utils/emitter'
import { entriesOf } from '@rebase.io/utils/entries-of'
import { keysOf } from '@rebase.io/utils/keys-of'
import { useIsomorphicLayoutEffect } from '@rebase.io/use-isomorphic-layout-effect'
import type { Validator, ValidatorOutput } from '@rebase.io/utils/validate'

type BaseConfig = {
  [Key in string]: {
    validate: Validator
  }
}

/**
 * https://crustack.vercel.app/hooks/define-storage/
 */
export function defineStorage<
  TDeserialized,
  TConfig extends BaseConfig,
  const TStorageOptions extends StorageServiceOptions<TDeserialized>,
>(config: TConfig, storageOptions: TStorageOptions) {
  const storage = createStorageService(storageOptions)

  type Store = {
    [Key in KeyOf<TConfig>]: ValidatorOutput<TConfig[Key]['validate']>
  }

  const emitter = createEmitter()

  const store = new Map(
    entriesOf(config).map(([key, value]) => [key, storage.getItem(key, value)]),
  )

  window.addEventListener('storage', ({ key }: { key: any }) => {
    if (keysOf(config).includes(key)) {
      const value = storage.getItem(key, config[key]!)
      store.set(key, value)
      emitter.emit(key, value)
    }
  })

  function useStorage<TKey extends KeyOf<TConfig>>(key: TKey) {
    const [state, setState] = React.useState<Store[TKey]>(() => store.get(key))

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
        storage.setItem(key, value)
        emitter.emit(key as any, value)
      },
      [key],
    )

    return [state, set] as const
  }

  // Could be non-hook
  function useClearStorage() {
    return React.useCallback((options?: { keys?: KeyOf<TConfig>[] }) => {
      const keys = options?.keys ?? keysOf(config)
      keys.forEach((key) => {
        storage.removeItem(key)
        const value = storage.getItem(key, config[key]!)
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

  type OutputType = TStorageOptions['type'] extends 'local'
    ? OutputLocal
    : OutputSession

  // assign to a typed variable before returning lets JSDocs work
  return storageOptions.type === 'local'
    ? ({
        useLocalStorage: useStorage,
        useClearLocalStorage: useClearStorage,
      } satisfies OutputLocal as OutputType)
    : ({
        useSessionStorage: useStorage,
        useClearSessionStorage: useClearStorage,
      } satisfies OutputSession as OutputType)
}
