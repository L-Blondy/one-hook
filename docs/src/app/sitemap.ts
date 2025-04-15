import type { MetadataRoute } from 'next'
import { source } from '@/lib/source'
import { baseUrl } from './base-url'

export const revalidate = false

export default async function sitemap() {
  return [
    sitemapEntry({
      url: '/',
      priority: 1,
      changeFrequency: 'monthly',
    }),
    sitemapEntry({
      url: '/docs',
      priority: 0.8,
      changeFrequency: 'monthly',
    }),
    ...source.getPages().map((page) =>
      sitemapEntry({
        url: page.url,
        priority: 1,
        changeFrequency: 'monthly',
      }),
    ),
  ]
}

function sitemapEntry({ url, ...rest }: MetadataRoute.Sitemap[number]) {
  return { url: new URL(url, baseUrl).toString(), ...rest }
}
