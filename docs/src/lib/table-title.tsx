import type { ReactNode } from 'react'

type Props = { value: ReactNode }

export function TableTitle(props: Props) {
  if (!props.value) return null
  return (
    <h4 className="flex items-center gap-2 font-mono">
      <div className="bg-fd-primary size-2 rounded-full brightness-90" />{' '}
      {props.value}
    </h4>
  )
}
