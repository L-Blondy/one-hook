import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'
import { source } from '@/lib/source'
import { repoUrl } from '@/utils/repo-url'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      githubUrl={repoUrl()}
      nav={{
        title: (
          <>
            <svg
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Logo"
            >
              <circle cx={12} cy={12} r={12} fill="currentColor" />
            </svg>
            1hook
          </>
        ),
      }}
    >
      {children}
    </DocsLayout>
  )
}
