import React from 'react'
import { useEventHandler } from '@one-stack/use-event-handler'
import { isServer } from '@one-stack/utils/is-server'

export type UseMutationObserverOptions = MutationObserverInit & {
  /**
   * Automatically observe the target element.
   *
   * @default true
   */
  autoObserve?: boolean
}

export type UseMutationObserverCallback = (
  entry: MutationRecord,
  observer: MutationObserver,
) => void

export type UseMutationObserverReturn = {
  /**
   * Manually starts observing the target element.
   */
  observe: () => void
  /**
   * Manually stops observing the target element.
   */
  unobserve: () => void
  /**
   * A callback ref to pass to the element to observe.
   *
   * @remarks `Function`
   */
  ref: React.Dispatch<React.SetStateAction<Element | null>>
  /**
   * The observed element.
   */
  target: Element | null
}

export const useMutationObserver = (
  callback: UseMutationObserverCallback,
  { autoObserve = true, ...options }: UseMutationObserverOptions = {},
) => {
  const stableOptions = useStableOptions(options)
  const stableCallback = useEventHandler(callback)
  const [target, ref] = React.useState<Element | null>(null)

  // never changes
  const observer = React.useMemo(
    () =>
      isServer
        ? null
        : new MutationObserver((entries, observer) => {
            entries.forEach((entry) => stableCallback(entry, observer))
          }),
    [stableCallback],
  )

  const observe = React.useCallback(() => {
    target && observer?.observe(target, stableOptions)
  }, [observer, target, stableOptions])

  // never changes
  const unobserve = React.useCallback(() => {
    observer?.disconnect()
  }, [observer])

  React.useEffect(() => {
    autoObserve && observe()
    return unobserve
  }, [stableCallback, autoObserve, observe, unobserve, target])

  return { observe, unobserve, ref, target }
}

function useStableOptions(options: MutationObserverInit) {
  const [stableOpts, setStableOpts] = React.useState(options)
  if (JSON.stringify(stableOpts) !== JSON.stringify(options)) {
    setStableOpts(options)
  }
  return stableOpts
}
