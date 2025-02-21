import React from 'react'

export function useRerender() {
  const [, setState] = React.useState({})
  return React.useCallback(() => setState({}), [])
}
