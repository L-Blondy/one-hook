import { act } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

type ObserverData = {
  callback: ResizeObserverCallback
  observeArgs: Map<Element, ResizeObserverOptions>
}

const observerMap = new Map<ResizeObserver, ObserverData>()

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
})

afterEach(() => {
  observerMap.clear()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

const ResizeObserverMock = vi.fn((callback: ResizeObserverCallback) => {
  const observerData: ObserverData = { callback, observeArgs: new Map() }

  const observer: ResizeObserver = {
    disconnect: vi.fn(() => {
      observerMap.delete(observer)
    }),
    observe: vi.fn((target: Element, options: ResizeObserverOptions) => {
      observerData.observeArgs.set(target, options)
      // the ResizeObserver API executes once by default when observing
      callback([createEntry(target)], observer)
    }),
    unobserve: vi.fn((target) => {
      observerData.observeArgs.delete(target)
    }),
  }
  observerMap.set(observer, observerData)
  return observer
})

export const mockResizeTargets = (props: { filter?: Element[] } = {}) => {
  act(() =>
    observerMap.forEach(({ callback, observeArgs }, observer) => {
      const entries: ResizeObserverEntry[] = []
      if (!observeArgs.size) return
      observeArgs.forEach((options, target) => {
        if (props.filter && !props.filter.includes(target)) return
        entries.push(createEntry(target))
      })
      callback(entries, observer)
    }),
  )
}

function createEntry(target: Element) {
  const size = { blockSize: 0, inlineSize: 0 }

  return {
    borderBoxSize: [size],
    contentBoxSize: [size],
    contentRect: {
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      toJSON() {},
      top: 0,
      width: 0,
      x: 0,
      y: 0,
    },
    devicePixelContentBoxSize: [size],
    target,
  }
}
