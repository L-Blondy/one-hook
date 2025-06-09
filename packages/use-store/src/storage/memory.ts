import type React from 'react'
import type { Storage } from '../define-store'
import { createEmitter } from '@1hook/utils/emitter'

export type MemoryOptions<T> = {
  initialState: T
}

export function memory<T>({ initialState }: MemoryOptions<T>): Storage<T> {
  const emitter = createEmitter<T>()
  const map = new Map<'', T>([['', initialState]])
  const storage = {
    get: () => map.get('')!,
    set(updater: React.SetStateAction<T>) {
      const next: T =
        typeof updater === 'function'
          ? (updater as any)(storage.get())
          : updater
      map.set('', next)
      emitter.emit(next)
    },
    subscribe: (listener: (state: T) => void) => emitter.on(listener),
  }
  return storage
}
