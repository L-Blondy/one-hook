import { createTypeTable } from 'fumadocs-typescript/ui'
import path from 'path'
import type React from 'react'

const fuma = createTypeTable({
  transform(entry, ctx) {},
})

type Props = React.ComponentProps<typeof fuma.AutoTypeTable> & {
  title?: string
  description?: string
}

export function AutoTypeTable(props: Props) {
  return (
    <div>
      <h4 className="flex items-center gap-2 font-mono">
        <div className="bg-fd-primary size-2 rounded-full brightness-90" />{' '}
        {props.title ?? props.name}
      </h4>

      {props.description && <p>{props.description}</p>}

      <fuma.AutoTypeTable
        {...props}
        path={
          typeof props.path === 'string'
            ? path.join(process.cwd(), '..', props.path)
            : props.path
        }
      />
    </div>
  )
}
