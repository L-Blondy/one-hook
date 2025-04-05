import type { ReactNode } from 'react'

type Props = { children: ReactNode }

export function Code(props: Props) {
  return (
    <code
      {...props}
      // same as <TypeTable />
      className="bg-fd-primary/10 text-fd-primary rounded-md p-1"
    />
  )
}
