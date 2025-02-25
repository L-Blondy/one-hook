import { source } from '@/lib/source'
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/page'
import { notFound } from 'next/navigation'
import { PackageDetails } from '@/lib/package-details'
import { MdxComponents } from '@/lib/mdx-components'

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body

  const isHook = params.slug?.includes('hooks')

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
        <MdxComponents MDX={MDX} />
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
