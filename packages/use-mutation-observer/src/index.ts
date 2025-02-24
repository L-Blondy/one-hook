import React from 'react'
import { useEventHandler } from '@1hook/use-event-handler'
import { isServer } from '@1hook/utils/is-server'

export type UseMutationObserverOptions = MutationObserverInit & {
  autoObserve?: boolean
}

export type UseMutationObserverCallback = (
  mutations: MutationRecord,
  observer: MutationObserver,
) => void

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
