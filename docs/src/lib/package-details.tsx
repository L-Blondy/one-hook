import 'server-only'
import path from 'path'
import fs from 'fs'
import { repoUrl } from '@/utils/repo-url'

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
      <div
        style={{
          background: '#505050',
          color: 'white',
          width: 'max-content',
          borderRadius: '3px 0 0 3px',
          paddingInlineStart: '0.5rem',
          paddingInlineEnd: '0.375rem',
          height: '1.5rem',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        Size
      </div>
      <div
        style={{
          background: 'var(--color-fd-primary)',
          color: 'white',
          width: 'max-content',
          borderRadius: '0 3px 3px 0',
          paddingInlineEnd: '0.5rem',
          paddingInlineStart: '0.375rem',
          height: '1.5rem',
          display: 'flex',
          alignItems: 'center',
        }}
      >
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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        textDecoration: 'none',
      }}
    >
      <span>View source</span>

      <svg
        height="18px"
        width="18px"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" />
        <path d="M11 13l9 -9" />
        <path d="M15 4h5v5" />
      </svg>
    </a>
  )
}
