import React from 'react'

/**
 * https://one-hook.vercel.app/docs
 */
export const useUpdateEffect: typeof React.useEffect = (effect, deps) => {
  const isFirstRef = React.useRef(true)

  React.useEffect(() => {
    if (!isFirstRef.current) {
      return effect()
    }
    // eslint-disable-next-line react-hooks/rule-suppression
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  React.useEffect(() => {
    isFirstRef.current = false
    return () => {
      isFirstRef.current = true
    }
  }, [])
}
