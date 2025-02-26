import { createTypeTable } from 'fumadocs-typescript/ui'
import path from 'path'
import type React from 'react'

const fuma = createTypeTable({
  transform: (d, i) => {
    console.log(d, i)
  },
})

type Props = React.ComponentProps<typeof fuma.AutoTypeTable>

export function AutoTypeTable(props: Props) {
  return (
    <fuma.AutoTypeTable
      {...props}
      path={
        typeof props.path === 'string'
          ? path.join(process.cwd(), '..', props.path)
          : props.path
      }
    />
  )
}
