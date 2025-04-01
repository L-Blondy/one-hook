import path from 'path'
import type React from 'react'
import { createGenerator } from 'fumadocs-typescript'
import { AutoTypeTable as FumaAutoTypeTable } from 'fumadocs-typescript/ui'

const generator = createGenerator()

type Props = React.ComponentProps<typeof FumaAutoTypeTable> & {
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

      <FumaAutoTypeTable
        {...props}
        path={
          typeof props.path === 'string'
            ? path.join(process.cwd(), '..', props.path)
            : props.path
        }
        // @ts-expect-error outdated type
        generator={generator}
      />
    </div>
  )
}
