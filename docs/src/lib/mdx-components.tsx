import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Popup, PopupContent, PopupTrigger } from 'fumadocs-twoslash/ui'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { Step, Steps } from 'fumadocs-ui/components/steps'
import type { FC } from 'react'
import type { MDXProps } from 'mdx/types'
import { AutoTypeTable } from './auto-type-table'
import { TypeTable } from 'fumadocs-ui/components/type-table'

export function MdxComponents({ MDX }: { MDX: FC<MDXProps> }) {
  return (
    <MDX
      components={{
        ...defaultMdxComponents,
        Popup,
        PopupContent,
        PopupTrigger,
        Tab,
        Tabs,
        Step,
        Steps,
        AutoTypeTable,
        TypeTable,
      }}
    />
  )
}
