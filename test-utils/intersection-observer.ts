import { act } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

type ObserverData = {
  callback: IntersectionObserverCallback
  targets: Set<Element>
}

const observerMap = new Map<IntersectionObserver, ObserverData>()

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
})

afterEach(() => {
  vi.restoreAllMocks()
  observerMap.clear()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

const IntersectionObserverMock = vi.fn(
  (
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit,
  ) => {
    const observerData: ObserverData = { callback, targets: new Set() }

    const intersectionObserver: IntersectionObserver = {
      disconnect: vi.fn(() => {
        observerMap.delete(intersectionObserver)
      }),
      observe: vi.fn((target: Element) => {
        observerData.targets.add(target)
      }),
      unobserve: vi.fn((target: Element) => {
        observerData.targets.delete(target)
      }),
      takeRecords: vi.fn(),
      root: options.root ?? document.documentElement,
      rootMargin: options.rootMargin ?? '0px 0px 0px 0px',
      thresholds: Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold || 0],
    }
    observerMap.set(intersectionObserver, observerData)
    return intersectionObserver
  },
)

export const mockIntersectTargets = (
  props: { filter?: Element[]; isIntersecting?: boolean } = {},
) => {
  act(() =>
    observerMap.forEach(({ callback, targets }, observer) => {
      const entries: IntersectionObserverEntry[] = []
      Array.from(targets).forEach((target) => {
        if (props.filter && !props.filter.includes(target)) return
        entries.push({
          boundingClientRect: (target as HTMLElement).getBoundingClientRect(),
          intersectionRect: (target as HTMLElement).getBoundingClientRect(),
          intersectionRatio: 0.5,
          isIntersecting: props.isIntersecting ?? true,
          rootBounds: (observer.root as HTMLElement).getBoundingClientRect(),
          target,
          time: Date.now(),
        })
      })
      callback(entries, observer)
    }),
  )
}
