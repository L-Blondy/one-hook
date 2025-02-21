import { act } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

type ObserverData = {
  callback: MutationCallback
  observeArgs: Map<Element, MutationObserverInit>
}

const observerMap = new Map<MutationObserver, ObserverData>()

beforeAll(() => {
  vi.stubGlobal('MutationObserver', MutationObserverMock)
})

afterEach(() => {
  observerMap.clear()
})

afterAll(() => {
  vi.unstubAllGlobals()
})

const MutationObserverMock = vi.fn((callback: MutationCallback) => {
  const observerData: ObserverData = { callback, observeArgs: new Map() }

  const observer: MutationObserver = {
    disconnect: vi.fn(() => {
      observerData.observeArgs.clear()
    }),
    observe: vi.fn((target: Element, options: MutationObserverInit) => {
      observerData.observeArgs.set(target, options)
    }),
    takeRecords: vi.fn(),
  }
  observerMap.set(observer, observerData)
  return observer
})

export const mockMutateTargets = (
  props: { filter?: Element[]; type?: MutationRecordType } = {},
) => {
  act(() =>
    observerMap.forEach(({ callback, observeArgs }, observer) => {
      const entries: MutationRecord[] = []
      if (!observeArgs.size) return
      observeArgs.forEach((options, target) => {
        if (props.filter && !props.filter.includes(target)) return
        if (props.type === 'attributes' && !options.attributes) return
        if (props.type === 'characterData' && !options.characterData) return
        if (props.type === 'childList' && !options.childList) return
        entries.push({
          addedNodes: [] as any,
          attributeName: 'class',
          attributeNamespace: 'namespace',
          nextSibling: null,
          oldValue: 'old',
          previousSibling: null,
          removedNodes: [] as any,
          target,
          type: props.type ?? 'attributes',
        })
      })
      callback(entries, observer)
    }),
  )
}
