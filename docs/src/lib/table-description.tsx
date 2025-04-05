import type { ReactNode } from 'react'

type Props = { value: ReactNode }

export function TableDescription(props: Props) {
  if (!props.value) return null
  return <p className="mb-0">{props.value}</p>
}
