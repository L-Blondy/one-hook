import React from 'react'
import { useLatestRef } from '@rebase.io/use-latest-ref'
import type { AnyFunction } from '@rebase.io/utils/types'

export function useEventHandler<const Fn extends AnyFunction | undefined>(
  cb: Fn,
): Fn extends undefined ? () => void : Fn {
  const cbRef = useLatestRef(cb)
  return React.useCallback<any>(
    (...args: any) => cbRef.current?.(...args),
    [cbRef],
  )
}
