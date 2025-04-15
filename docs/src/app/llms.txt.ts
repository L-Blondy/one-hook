import fs from 'fs'
import path from 'path'
import { source } from '@/lib/source'
import { baseUrl } from './base-url'

const filePath = 'public/llms.txt'
const OUTPUT_FILE = path.join(process.cwd(), filePath)

function parseFrontmatter(content: string): {
  title?: string
  description?: string
} {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/)
  if (!frontmatterMatch) return {}

  const [, frontmatter = ''] = frontmatterMatch
  const titleMatch = frontmatter.match(/title:\s*(.*)/)
  const descriptionMatch = frontmatter.match(/description:\s*(.*)/)

  return {
    title: titleMatch?.[1]?.trim(),
    description: descriptionMatch?.[1]?.trim(),
  }
}

export async function generateLLMsTxt() {
  const pages = source.getPages()
  let content = '# one-hook\n\n'
  content += '## docs\n\n'

  // Add home page
  const homeContent = fs.readFileSync(
    path.join(process.cwd(), 'content/index.mdx'),
    'utf-8',
  )
  const { title: homeTitle, description: homeDescription } =
    parseFrontmatter(homeContent)
  if (homeTitle) {
    content += `- [${homeTitle}](${baseUrl}): ${homeDescription || ''}\n`
  }

  // Add all other pages
  for (const page of pages) {
    const filePath = path.join(
      process.cwd(),
      'content',
      `${page.url.replace('/docs/', '')}.mdx`,
    )
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { title, description } = parseFrontmatter(fileContent)
      if (title) {
        content += `- [${title}](${new URL(page.url, baseUrl).toString()}): ${description || ''}\n`
      }
    }
  }

  // Add optional section
  content += '\n# optional\n\n'

  // Read repository URL from package.json
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), '../package.json'), 'utf-8'),
  )
  const repoUrl = packageJson.homepage
  content += `- [GitHub Repository](${repoUrl})\n`

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, content)
  console.log(` ✓ Generated ${filePath}`)
}

generateLLMsTxt()
