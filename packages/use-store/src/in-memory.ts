import type React from 'react'
import type { Store } from './define-store'
import { createEmitter } from '@1hook/utils/emitter'

export function createInMemoryStore<T>(): Store<T> {
  const emitter = createEmitter()
  const map = new Map<'', T>()
  const store = {
    get: () => map.get(''),
    set(updater: React.SetStateAction<T>) {
      const next: T =
        typeof updater === 'function' ? (updater as any)(store.get()) : updater
      map.set('', next)
      emitter.emit('', next)
    },
    subscribe: (listener: (state: T) => void) =>
      emitter.on((_, state) => listener(state)),
  }
  return store
}
