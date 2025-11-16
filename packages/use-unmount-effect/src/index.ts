import React from 'react'

/**
 * https://one-hook.vercel.app/docs
 */
export function useUnmountEffect(callback: () => any) {
  const _cb = React.useEffectEvent(callback)
  React.useEffect(() => _cb, [])
}
