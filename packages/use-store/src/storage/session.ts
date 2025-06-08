import type React from 'react'
import { createEmitter } from '@1hook/utils/emitter'
import {
  validateSync,
  type Validator,
  type ValidatorOutput,
} from '@1hook/utils/validate'
import { defaultDeserializer, defaultSerializer } from 'src/serialize'

export type SessionStorageOptions<TValidator extends Validator<unknown>> = {
  /**
   * The key of the session storage.
   */
  key: string
  /**
   * The validator for the value, can be:
   * - a function that returns a the value or throws an error
   * - a `StandardSchema` (e.g. a zod, valibot or arktype schema)
   */
  validate: TValidator
  /**
   * Custom serializer for the session storage.
   */
  serialize?: (value: unknown) => string
  /**
   * Custom deserializer for the session storage.
   */
  deserialize?: (value: string) => any
}

export function session<TValidator extends Validator<unknown>>({
  key,
  validate,
  serialize = defaultSerializer,
  deserialize = defaultDeserializer,
}: SessionStorageOptions<TValidator>) {
  const emitter = createEmitter()
  type State = ValidatorOutput<TValidator>

  const storage = {
    set(updater: React.SetStateAction<State>): void {
      const next: State =
        typeof updater === 'function'
          ? (updater as any)(storage.get())
          : updater
      sessionStorage.setItem(key, serialize(next))
      emitter.emit('', next)
    },
    get(): State {
      let value = sessionStorage.getItem(key) ?? undefined
      let parsed = value === undefined ? value : deserialize(value)
      return validateSync(validate, parsed)
    },
    remove(): void {
      sessionStorage.removeItem(key)
      emitter.emit('', storage.get())
    },
    subscribe: (listener: (state: State) => void) =>
      emitter.on((_, state) => listener(state)),
  }

  // cross-tab sync
  window.addEventListener('storage', (e) => {
    if (e.key === key) {
      const value = storage.get()
      emitter.emit('', value)
    }
  })

  return storage
}
