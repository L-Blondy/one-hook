import type { MetadataRoute } from 'next'
import { source } from '@/lib/source'
import { baseUrl } from './base-url'
import { generateLLMsFullTxt } from './llms-full.txt'
import { generateLLMsTxt } from './llms.txt'

export const revalidate = false

export default async function sitemap() {
  // Generate LLM stuff
  await generateLLMsTxt()
  await generateLLMsFullTxt()

  return [
    sitemapEntry({
      url: '/',
      priority: 1,
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
