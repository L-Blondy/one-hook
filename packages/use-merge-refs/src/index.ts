import React from 'react'

type AnyRef<T> =
  | React.MutableRefObject<T>
  | ((value: T) => void)
  | undefined
  | null

export function mergeRefs<T, U = T, V = T>(
  ref1: AnyRef<T>,
  ref2: AnyRef<U>,
  ref3?: AnyRef<V>,
) {
  return (val: T | U | V) => {
    ;[ref1, ref2, ref3].forEach((ref) => {
      if (!ref) return
      if (typeof ref === 'function') {
        ref(val as any)
      } else {
        ref.current = val
      }
    })
  }
}

/**
 * https://one-hook.vercel.app/docs
 */
export const useMergeRefs = <T, U = T, V = T>(
  ref1: AnyRef<T>,
  ref2: AnyRef<U>,
  ref3?: AnyRef<V>,
) => {
  return React.useCallback(
    (v: T | U | V) => mergeRefs(ref1, ref2, ref3)(v),
    [ref1, ref2, ref3],
  )
}
