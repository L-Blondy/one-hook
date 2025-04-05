import {
  validateSync,
  type Validator,
  type ValidatorOutput,
} from '@1hook/utils/validate'
import { defaultDeserializer, defaultSerializer } from './serializers'
import type { KeyOf } from '@1hook/utils/types'

export type ServiceOptions = {
  type: 'local' | 'session'
  serialize?: (value: unknown) => string
  deserialize?: (value: string) => any
}

export type StorageValidator<TOutput = unknown> = Validator<TOutput>

export function createStorageService<
  TConfig extends Record<string, StorageValidator>,
>(config: TConfig, options: ServiceOptions) {
  type StorageKey = KeyOf<TConfig>
  type StorageValue<TKey extends StorageKey> = ValidatorOutput<TConfig[TKey]>

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
      return validateSync(config[key] as any, parsed)
    },
    remove: (key: StorageKey) => storage.removeItem(key),
  }
}
