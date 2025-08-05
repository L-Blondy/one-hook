import React from 'react'
import { useEventHandler } from '@1hook/use-event-handler'

/**
 * https://one-hook.vercel.app/docs
 */
export function useUnmountEffect(callback: () => any) {
  const _cb = useEventHandler(callback)
  React.useEffect(() => _cb, [_cb])
}
