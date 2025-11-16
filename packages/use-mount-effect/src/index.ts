import React from 'react'

/**
 * https://one-hook.vercel.app/docs
 */
export function useMountEffect(callback: () => any) {
  const _cb = React.useEffectEvent(callback)
  React.useEffect(() => {
    _cb()
  }, [])
}
