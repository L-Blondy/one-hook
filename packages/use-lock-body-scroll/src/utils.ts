import { isServer } from '@one-stack/utils/is-server'

function isScrollable(node: HTMLElement | null | undefined): boolean {
  if (!node) return false
  let style = window.getComputedStyle(node)
  let isScrollable = /(auto|scroll)/.test(
    style.overflow + style.overflowX + style.overflowY,
  )

  if (isScrollable) {
    isScrollable =
      node.scrollHeight !== node.clientHeight ||
      node.scrollWidth !== node.clientWidth
  }

  return isScrollable
}

export function getClosestScrollable(
  node: HTMLElement | null | undefined,
): HTMLElement {
  while (node && !isScrollable(node)) {
    node = node.parentElement
  }

  return (
    node ||
    (document.scrollingElement as HTMLElement | null) ||
    document.documentElement
  )
}

export function isIosDevice() {
  return (
    !isServer &&
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    window.navigator?.platform &&
    /iP(ad|hone|od)/.test(window.navigator.platform)
  )
}
