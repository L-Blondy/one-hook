import { remarkInstall } from 'fumadocs-docgen'
import { defineDocs, defineConfig } from 'fumadocs-mdx/config'
import { transformerTwoslash } from 'fumadocs-twoslash'
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins'

export const docs = defineDocs({
  dir: 'content', // in the content folder
})

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [[remarkInstall, { persist: { id: 'package-manager' } }]],
    rehypeCodeOptions: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerTwoslash({
          twoslashOptions: {
            compilerOptions: {
              allowUmdGlobalAccess: true,
            },
          },
        }),
      ],
    },
  },
})
