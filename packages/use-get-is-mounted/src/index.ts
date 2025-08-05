import React from 'react'

/**
 * https://one-hook.vercel.app/docs
 */
export function useGetIsMounted() {
  const isMounted = React.useRef(true)

  React.useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  return React.useCallback(() => isMounted.current, [])
}
