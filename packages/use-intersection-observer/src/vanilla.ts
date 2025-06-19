import { getInstanceId, type InstanceId } from './utils'

export type IntersectionObserverInstance = ReturnType<typeof createInstance>

const instanceMap = new Map<InstanceId, IntersectionObserverInstance>()

export function getIntersectionObserver(
  options: IntersectionObserverInit,
): IntersectionObserverInstance {
  const id = getInstanceId(options)
  return instanceMap.get(id) ?? createInstance(id, options)
}

export type Callback = (
  entry: IntersectionObserverEntry,
  observer: IntersectionObserverInstance,
) => void

function createInstance(id: InstanceId, options: IntersectionObserverInit) {
  const callbackMap = new Map<Element, Set<Callback>>()
  const observer = new IntersectionObserver(
    (entries) =>
      entries
        // sort by time, see https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#intersection_change_callbacks
        .sort((a, b) => (a.time < b.time ? -1 : 1))
        .forEach((entry) => {
          callbackMap.get(entry.target)?.forEach((callback) => {
            callback(entry, instance)
          })
        }),
    options,
  )

  const instance = {
    id,
    root: observer.root,
    rootMargin: observer.rootMargin,
    thresholds: observer.thresholds,
    takeRecords: observer.takeRecords,

    observe(target: Element, callback: Callback) {
      const callbacks = callbackMap.get(target) ?? new Set()
      callbacks.add(callback)
      callbackMap.set(target, callbacks)
      observer.observe(target)
    },

    unobserve(target: Element | null | undefined | false, callback: Callback) {
      if (!target) return
      const callbacks = callbackMap.get(target) ?? new Set()
      callbacks.delete(callback)
      if (!callbacks.size) {
        callbackMap.delete(target)
        observer.unobserve(target)
      }
      if (!callbackMap.size) {
        this.disconnect()
        // this is ok since the current observer is in memory
        // new instances will add the new observer to the map
        instanceMap.delete(id)
      }
    },

    disconnect() {
      observer.disconnect()
    },
  }
  instanceMap.set(id, instance)
  return instance
}
