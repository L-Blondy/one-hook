import {
  validateSync,
  type Validator,
  type ValidatorOutput,
} from '@one-stack/utils/validate'
import { defaultDeserializer, defaultSerializer } from './serializers'
import type { KeyOf } from '@one-stack/utils/types'

export type ServiceOptions = {
  type: 'local' | 'session'
  serialize?: (value: unknown) => string
  deserialize?: (value: string) => any
}

export type StorageConfig<TOutput = unknown> = {
  validate: Validator<TOutput>
}

export function createStorageService<
  TConfig extends Record<string, StorageConfig>,
>(config: TConfig, options: ServiceOptions) {
  type StorageKey = KeyOf<TConfig>
  type StorageValue<TKey extends StorageKey> = ValidatorOutput<
    TConfig[TKey]['validate']
  >

  const storage = options.type === 'local' ? localStorage : sessionStorage
  const serialize = options.serialize ?? defaultSerializer
  const deserialize = options.deserialize ?? defaultDeserializer

  return {
    set<TKey extends StorageKey>(key: TKey, value: StorageValue<TKey>): void {
      storage.setItem(key, serialize(value))
    },
    get<TKey extends StorageKey>(key: TKey): StorageValue<TKey> {
      let value = storage.getItem(key) ?? undefined
      let parsed = value === undefined ? value : deserialize(value)
      return validateSync((config[key] as any).validate, parsed)
    },
    remove: (key: StorageKey) => storage.removeItem(key),
  }
}
