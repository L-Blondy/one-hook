import path from 'path'
import type React from 'react'
import { createGenerator } from 'fumadocs-typescript'
import { AutoTypeTable as FumaAutoTypeTable } from 'fumadocs-typescript/ui'
import { TableTitle } from './table-title'
import { TableDescription } from './table-description'

const generator = createGenerator({
  tsconfigPath: path.join(
    process.cwd(),
    process.cwd().endsWith('docs') ? '' : 'docs',
    'tsconfig.json',
  ),
})

type Props = React.ComponentProps<typeof FumaAutoTypeTable> & {
  title?: string
  description?: string
}

export function AutoTypeTable(props: Props) {
  return (
    <div>
      <TableTitle value={props.title || props.name} />

      <TableDescription value={props.description} />

      <FumaAutoTypeTable
        {...props}
        path={
          typeof props.path === 'string'
            ? path.join(
                process.cwd(),
                process.cwd().endsWith('docs') ? '..' : '',
                props.path,
              )
            : props.path
        }
        generator={generator}
      />
    </div>
  )
}
