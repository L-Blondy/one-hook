import fs from 'fs'
import path from 'path'
import { source } from '@/lib/source'

const filePath = 'public/llms-full.txt'
const OUTPUT_FILE = path.join(process.cwd(), filePath)

function parseFrontmatter(content: string): {
  title?: string
  description?: string
  markdown: string
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!frontmatterMatch) return { markdown: content }

  const [, frontmatter = '', markdown = ''] = frontmatterMatch
  const titleMatch = frontmatter.match(/title:\s*(.*)/)
  const descriptionMatch = frontmatter.match(/description:\s*(.*)/)

  return {
    title: titleMatch?.[1]?.trim(),
    description: descriptionMatch?.[1]?.trim(),
    markdown: markdown.trim(),
  }
}

function transformFrontmatter(content: string): string {
  const { title, description, markdown } = parseFrontmatter(content)

  // Transform title to h1
  const titleText = title ? `# ${title}\n\n` : ''

  // Add description if exists
  const descriptionText = description ? `${description}\n\n` : ''

  return `${titleText}${descriptionText}${markdown}`
}

export async function generateLLMsFullTxt() {
  const pages = source.getPages()
  let fullContent = ''

  // Add home page content
  const homeContent = fs.readFileSync(
    path.join(process.cwd(), 'content/index.mdx'),
    'utf-8',
  )
  fullContent += transformFrontmatter(homeContent) + '\n\n---\n\n'

  // Add all other pages
  for (const page of pages) {
    const filePath = path.join(
      process.cwd(),
      'content',
      `${page.url.replace('/docs/', '')}.mdx`,
    )
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      fullContent += transformFrontmatter(content) + '\n\n---\n\n'
    }
  }

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, fullContent)
  console.info(` ✓ Generated ${filePath}`)
}
