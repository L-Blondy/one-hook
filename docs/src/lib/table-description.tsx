import React from 'react'

type Props = { value: React.ReactNode }

export function TableDescription(props: Props) {
  if (!props.value) return null
  return <p className="mb-0">{props.value}</p>
}
