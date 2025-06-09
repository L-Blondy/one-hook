import React from 'react'
import { createEmitter } from '@1hook/utils/emitter'
import {
  validateSync,
  type Validator,
  type ValidatorOutput,
} from '@1hook/utils/validate'
import { defaultDeserializer, defaultSerializer } from './serializer'
import { isServer } from '@1hook/utils/is-server'
import { useIsHydrated } from '@1hook/use-is-hydrated'

export type DefineStorageOptions<TValidator extends Validator<unknown>> = {
  /**
   * The type of the storage.
   */
  type: 'local' | 'session'
  /**
   * The key of the local storage.
   */
  key: string
  /**
   * The validator for the value, can be:
   * - a function that returns a the value or throws an error
   * - a `StandardSchema` (e.g. a zod, valibot or arktype schema)
   */
  validate: TValidator
  /**
   * Custom serializer for the cookie.
   */
  serialize?: (value: unknown) => string
  /**
   * Custom deserializer for the cookie.
   */
  deserialize?: (value: string) => any
}

type Unsubscribe = () => void

export type DefineStorageReturn<TValidator extends Validator<unknown>> = [
  useStorage: () => [
    ValidatorOutput<TValidator>,
    React.Dispatch<React.SetStateAction<ValidatorOutput<TValidator>>>,
  ],
  storage: {
    set(updater: React.SetStateAction<ValidatorOutput<TValidator>>): void
    get(): ValidatorOutput<TValidator>
    remove(): void
    subscribe: (
      listener: (state: ValidatorOutput<TValidator>) => void,
    ) => Unsubscribe
  },
]

export function defineStorage<TValidator extends Validator<unknown>>({
  type,
  key,
  validate,
  serialize = defaultSerializer,
  deserialize = defaultDeserializer,
}: DefineStorageOptions<TValidator>): DefineStorageReturn<TValidator> {
  type State = ValidatorOutput<TValidator>
  const emitter = createEmitter<State>()
  const storage = isServer
    ? undefined
    : type === 'local'
      ? localStorage
      : sessionStorage

  const serverSnapshot = validateSync(validate, undefined as any)

  const service = {
    set(updater: React.SetStateAction<State>): void {
      const next: State =
        typeof updater === 'function'
          ? (updater as any)(service.get())
          : updater
      next === undefined
        ? storage?.removeItem(key)
        : storage?.setItem(key, serialize(next))
      emitter.emit(next)
    },
    get(): State {
      let value = storage?.getItem(key) ?? undefined
      let parsed = value === undefined ? value : deserialize(value)
      return validateSync(validate, parsed)
    },
    remove(): void {
      storage?.removeItem(key)
      emitter.emit(service.get())
    },
    subscribe: (listener: (state: State) => void) => emitter.on(listener),
  }

  // cross-tab sync
  if (!isServer && type === 'local') {
    window.addEventListener('storage', (e) => {
      if (e.key === key) {
        emitter.emit(service.get())
      }
    })
  }

  function useStorage() {
    const isHydrated = useIsHydrated()
    const [state, setState] = React.useState<State>(service.get)
    React.useLayoutEffect(() => service.subscribe(setState), [])
    return [isHydrated ? state : serverSnapshot, service.set] as [
      State,
      React.Dispatch<React.SetStateAction<State>>,
    ]
  }

  return [useStorage, service] as const
}
