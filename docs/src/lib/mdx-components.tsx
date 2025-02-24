import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Popup, PopupContent, PopupTrigger } from 'fumadocs-twoslash/ui'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { Step, Steps } from 'fumadocs-ui/components/steps'
import { FC } from 'react'
import { MDXProps } from 'mdx/types'

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
      }}
    />
  )
}
