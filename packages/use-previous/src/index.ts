import React from 'react'

export type UsePreviousOptions<T> = {
  isEqual?: (prev: T | undefined, next: T) => boolean
}

/**
 * https://crustack.vercel.app/hooks/use-previous/
 */
export function usePrevious<T>(
  value: T,
  { isEqual = Object.is }: UsePreviousOptions<T> = {} as any,
): T | undefined {
  const [state, setState] = React.useState({
    prev: undefined as T | undefined,
    current: value,
  })

  if (!isEqual(value, state.current)) {
    setState({
      prev: state.current,
      current: value,
    })
  }

  return state.prev
}
