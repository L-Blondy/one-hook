import React from 'react'
import { useLatestRef } from '@1hook/use-latest-ref'
import type { AnyFunction } from '@1hook/utils/types'

/**
 * @deprecated For React 19.2.0+, use the built-in `useEffectEvent` hook instead.
 *
 * https://one-hook.vercel.app/docs
 */
export function useEventHandler<const Fn extends AnyFunction | undefined>(
  cb: Fn,
): Fn extends undefined ? () => void : Fn {
  const cbRef = useLatestRef(cb)
  return React.useCallback<any>(
    (...args: any) => cbRef.current?.(...args),
    [cbRef],
  )
}
