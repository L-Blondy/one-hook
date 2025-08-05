import React from 'react'

/**
 * https://one-hook.vercel.app/docs
 */
export function useRerender() {
  const [, setState] = React.useState({})
  return React.useCallback(() => setState({}), [])
}
