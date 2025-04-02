import path from 'path'
import type React from 'react'
import { createGenerator } from 'fumadocs-typescript'
import { AutoTypeTable as FumaAutoTypeTable } from 'fumadocs-typescript/ui'
import { TableTitle } from './table-title'
import { TableDescription } from './table-description'

const generator = createGenerator()

type Props = React.ComponentProps<typeof FumaAutoTypeTable> & {
  title?: string
  description?: string
}

export function AutoTypeTable(props: Props) {
  return (
    <div>
      <TableTitle value={props.title} />

      <TableDescription value={props.description} />

      <FumaAutoTypeTable
        {...props}
        path={
          typeof props.path === 'string'
            ? path.join(process.cwd(), '..', props.path)
            : props.path
        }
        generator={generator}
      />
    </div>
  )
}
