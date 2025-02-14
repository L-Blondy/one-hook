/* eslint-disable @typescript-eslint/no-empty-object-type */
import React from 'react'

/**
 * https://crustack.vercel.app/hooks/use-forward-generic-ref/
 */
export function forwardGenericRef<T, P = {}>(
  render: (props: P, ref: React.Ref<T>) => React.ReactElement | null,
): (props: P & React.RefAttributes<T>) => React.ReactElement | null {
  return React.forwardRef(render as any) as any
}
