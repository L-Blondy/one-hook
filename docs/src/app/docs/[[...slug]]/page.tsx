import { source } from '@/lib/source'
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import { PackageDetails } from '@/lib/package-details'
import defaultMdxComponents, { createRelativeLink } from 'fumadocs-ui/mdx'
import { Popup, PopupContent, PopupTrigger } from 'fumadocs-twoslash/ui'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { Step, Steps } from 'fumadocs-ui/components/steps'
import { TypeTable } from 'fumadocs-ui/components/type-table'
import { AutoTypeTable } from '@/lib/auto-type-table'
import { TableTitle } from '@/lib/table-title'
import { TableDescription } from '@/lib/table-description'
import { Code } from '@/lib/code'

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDXContent = page.data.body

  const isHook =
    params.slug?.[0] === 'hooks' && params.slug?.[1]?.startsWith('use')

  return (
    <DocsPage
      breadcrumb={{ enabled: false }}
      toc={page.data.toc.filter((t) => t.depth <= 2)}
      full={page.data.full}
    >
      <DocsTitle className="border-b pb-4">{page.data.title}</DocsTitle>

      {!!isHook && <PackageDetails filename={page.file.name} />}

      <DocsDescription className="mb-4">
        {page.data.description}
      </DocsDescription>

      <DocsBody>
        <MDXContent
          components={{
            ...defaultMdxComponents,
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
            Code,
            Popup,
            PopupContent,
            PopupTrigger,
            Tab,
            Tabs,
            Step,
            Steps,
            AutoTypeTable,
            TypeTable,
            TableTitle,
            TableDescription,
          }}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
  }
}
