import React from 'react'

export type UsePreviousOptions<T> = {
  /**
   * The function to compare the previous and current values.
   *
   * @default Object.is
   */
  isEqual?: (prev: T | undefined, next: T) => boolean
}

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
