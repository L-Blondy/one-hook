import React from 'react'
import { useEventHandler } from '@one-stack/use-event-handler'

export function useMountEffect(callback: () => any) {
  const _cb = useEventHandler(callback)
  React.useEffect(() => {
    _cb()
  }, [_cb])
}
