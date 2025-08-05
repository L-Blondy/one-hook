import React from 'react'

/**
 * https://one-hook.vercel.app/docs
 */
export const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect
