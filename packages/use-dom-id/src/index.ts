import React from 'react'

/**
 * https://crustack.vercel.app/hooks/use-dom-id/
 */
export function useDomId() {
  return 'a' + React.useId()
}
