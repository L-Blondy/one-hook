let elementUid = 0
const ids = new WeakMap<Element | Window | Document, number>()

export function getElementUid(
  element: Element | Window | Document | null | undefined,
) {
  if (!element) return 0
  if (ids.has(element)) return ids.get(element)
  ids.set(element, ++elementUid)
  return elementUid
}
