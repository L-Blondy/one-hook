export type Emitter<
  TChannelToMessage extends Record<string, any> = Record<string, any>,
> = ReturnType<typeof createEmitter<TChannelToMessage>>

export function createEmitter<T>() {
  type Id = number
  type Listener = (message: T) => any
  // Map instead of Set allows multiple listeners with the same pure function
  const __l = new Map<Id, Listener>()
  let count = 0

  return {
    __l,
    on(listener: Listener) {
      const id = ++count
      __l.set(id, listener)
      return () => {
        __l.delete(id)
      }
    },
    emit(message: T) {
      __l.forEach((listener) => {
        listener(message)
      })
    },
  }
}
