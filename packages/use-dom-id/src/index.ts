import React from 'react'

export function useDomId() {
  return 'a' + React.useId()
}
