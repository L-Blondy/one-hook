import 'server-only'
import path from 'path'
import fs from 'fs'
import { repoUrl } from '@/utils/repo-url'
import { ExternalLink } from 'lucide-react'

type Props = { filename: string }

export function PackageDetails({ filename }: Props) {
  return (
    <div className="flex items-center justify-between gap-2">
      <BuildSize filename={filename} />
      <SourceLink filename={filename} />
    </div>
  )
}

function BuildSize({ filename }: Props) {
  function getFileSize() {
    const filePath = path.join(
      process.cwd(),
      `../packages/${filename}/dist/index.min.js.gz`,
    )
    const stats = fs.statSync(filePath)
    const fileSize = stats.size / 1000
    return fileSize.toFixed(2) + ' kb'
  }

  return (
    <div
      className="not-content"
      style={{
        width: 'max-content',
        fontSize: '0.8125rem',
        letterSpacing: '0.05em',
        fontWeight: '400',
        display: 'flex',
      }}
    >
      <div className="flex h-6 w-max items-center rounded-l-sm bg-[#505050] px-2 py-1 text-white">
        Size
      </div>
      <div className="bg-fd-primary flex h-6 w-max items-center rounded-r-sm px-2 py-1 text-white">
        {getFileSize()}
      </div>
    </div>
  )
}

function SourceLink({ filename }: { filename: string }) {
  const href = path.join(repoUrl(), 'tree/main/packages', filename)
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-fd-primary inline-flex items-center gap-2 text-sm font-medium leading-5 no-underline hover:underline"
    >
      <span>View source</span>

      <ExternalLink size={16} strokeWidth={2.5} />
    </a>
  )
}
