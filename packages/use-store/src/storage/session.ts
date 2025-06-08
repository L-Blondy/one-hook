import type React from 'react'
import { createEmitter } from '@1hook/utils/emitter'
import {
  validateSync,
  type Validator,
  type ValidatorOutput,
} from '@1hook/utils/validate'

export type SessionStorageOptions<TValidator extends Validator<unknown>> = {
  key: string
  validate: TValidator
  serialize?: (value: unknown) => string
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

// Main caveats:
// - `NaN` becomes `null`
// - `undefined` becomes `null` in arrays
// - Dates are transformed toISOString
// - BigInt throw

/**
 * strings are not modified, everything else is transformed into a stringified object
 */
const defaultSerializer = (v: unknown) =>
  typeof v === 'string' ? v : JSON.stringify({ $v: v })
const defaultDeserializer = (v: string) =>
  v.startsWith('{') ? JSON.parse(v).$v : v
