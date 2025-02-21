import type {
  UseEventListenerTarget,
  UseEventListenerType,
  UseEventListenerCallback,
  EventListenerService,
} from './types'
import { getInstanceId, type InstanceId } from './utils'

export const instanceMap = new Map<InstanceId, EventListenerService<any, any>>()

type Options = Omit<AddEventListenerOptions, 'signal'>

export function getEventListener<
  Target extends UseEventListenerTarget,
  Type extends UseEventListenerType<Target>,
>(
  target: Target,
  type: Type,
  { once, ...options }: Options = {},
): EventListenerService<Target, Type> {
  const id = getInstanceId(target, type, options)
  return (
    instanceMap.get(id) ??
    createInstance(id, target, type, { once, ...options })
  )
}

export function createInstance<
  Target extends UseEventListenerTarget,
  Type extends UseEventListenerType<Target>,
>(id: InstanceId, target: Target, type: Type, { once, ...options }: Options) {
  type Callback = UseEventListenerCallback<Target, Type>
  const callbacks: Set<Callback> = new Set()
  let listenerAdded = false

  function listener(e: any) {
    callbacks.forEach((cb) => {
      cb(e)
      once && instance.remove(cb)
    })
  }

  const instance = {
    add(callback: Callback) {
      callbacks.add(callback)
      if (!listenerAdded) {
        listenerAdded = true
        target.addEventListener(type, listener, options)
      }
      return () => this.remove(callback)
    },
    remove(callback: Callback) {
      callbacks.delete(callback)
      if (!callbacks.size) {
        target.removeEventListener(type, listener, options)
        listenerAdded = false
        instanceMap.delete(id)
      }
    },
  }

  instanceMap.set(id, instance)

  return instance
}
