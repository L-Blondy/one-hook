import path from 'path'
import type React from 'react'
import { createGenerator } from 'fumadocs-typescript'
import { AutoTypeTable as FumaAutoTypeTable } from 'fumadocs-typescript/ui'
import { TableTitle } from './table-title'
import { TableDescription } from './table-description'

const generator = createGenerator()

function logFileStructure() {
  const fs = require('fs')
  const path = require('path')

  function walkSync(dir: string, filelist: string[] = []) {
    const files = fs.readdirSync(dir)

    files.forEach((file) => {
      const filepath = path.join(dir, file)
      const stats = fs.statSync(filepath)

      if (stats.isDirectory()) {
        filelist = walkSync(filepath, filelist)
      } else {
        filelist.push(filepath)
      }
    })

    return filelist
  }

  const cwd = process.cwd()
  console.log('File structure under', cwd)
  console.log(
    walkSync(cwd)
      .map((f) => f)
      .filter((f) => !f.includes('node_modules'))
      .filter((f) => !f.includes('vendor-chunks'))
      .filter((f) => !f.includes('.next'))
      .join('\n'),
  )

  console.log({ cwd })
}

logFileStructure()

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
            ? path.join(process.cwd(), '..', props.path)
            : props.path
        }
        generator={generator}
      />
    </div>
  )
}
