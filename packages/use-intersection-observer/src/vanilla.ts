import { getInstanceId, type InstanceId } from './utils'

export type IntersectionObserverInstance = ReturnType<typeof createInstance>

/**
 * Store the instances the reuse based on a unique id.
 */
const instanceMap = new Map<InstanceId, IntersectionObserverInstance>()

export function getIntersectionObserver(
  options: IntersectionObserverInit,
): IntersectionObserverInstance {
  const id = getInstanceId(options)
  return instanceMap.get(id) ?? createInstance(id, options)
}

export type Listener = (
  entry: IntersectionObserverEntry,
  observer: IntersectionObserverInstance,
) => void

function createInstance(id: InstanceId, options: IntersectionObserverInit) {
  /**
   * Store the listeners for each observed element.
   */
  const listenerMap = new Map<Element, Set<Listener>>()
  const observer = new IntersectionObserver(
    (entries) =>
      entries
        // sort by time, see https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#intersection_change_callbacks
        .sort((a, b) => (a.time < b.time ? -1 : 1))
        .forEach((entry) => {
          listenerMap.get(entry.target)?.forEach((listener) => {
            listener(entry, instance)
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

    observe(target: Element, listener: Listener) {
      const listeners = listenerMap.get(target) ?? new Set()
      listeners.add(listener)
      listenerMap.set(target, listeners)
      observer.observe(target)
    },

    unobserve(target: Element | null | undefined | false, listener: Listener) {
      if (!target) return
      const listeners = listenerMap.get(target) ?? new Set()
      listeners.delete(listener)
      if (!listeners.size) {
        listenerMap.delete(target)
        observer.unobserve(target)
      }
      if (!listenerMap.size) {
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
