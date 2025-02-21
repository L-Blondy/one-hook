import { validateSync, type Validator } from '@rebase.io/utils/validate'
import { defaultDeserializer, defaultSerializer } from './serializers'

export type StorageServiceOptions<TDeserialized> = {
  type: 'local' | 'session'
  serialize?: (value: NoInfer<TDeserialized>) => string
  deserialize?: (value: string) => TDeserialized
}

export function createStorageService<TDeserialized>({
  type,
  serialize = defaultSerializer,
  deserialize = defaultDeserializer,
}: StorageServiceOptions<TDeserialized>) {
  const storage = type === 'local' ? localStorage : sessionStorage

  return {
    setItem(key: string, value: TDeserialized): void {
      storage.setItem(key, serialize(value))
    },
    getItem<T extends TDeserialized | undefined>(
      key: string,
      config: { validate: Validator<TDeserialized | undefined, T> },
    ): T {
      let value = storage.getItem(key) ?? undefined
      let parsed = value === undefined ? value : deserialize(value)
      return validateSync(config.validate, parsed)
    },
    removeItem: (key: string) => storage.removeItem(key),
  }
}
