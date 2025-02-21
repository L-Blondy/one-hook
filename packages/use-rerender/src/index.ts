import React from 'react'

/**
 * https://crustack.vercel.app/hooks/use-rerender/
 */
export function useRerender() {
  const [, setState] = React.useState({})
  return React.useCallback(() => setState({}), [])
}
