import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'
import { source } from '@/lib/source'
import { repoUrl } from '@/utils/repo-url'
import { Captions, Webhook } from 'lucide-react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      githubUrl={repoUrl()}
      nav={{
        title: (
          <>
            <div className="to-fd-primary outline-fd-primary/60 size-5 translate-x-px rounded-full bg-gradient-to-br from-transparent outline" />
            one-stack
          </>
        ),
      }}
      sidebar={{
        tabs: [
          {
            title: 'Hooks',
            description: 'Hooks',
            url: '/docs/hooks',
            icon: <SidebarIcon icon={<Webhook />} />,
          },
          {
            title: 'Form',
            description: 'Form',
            url: '/docs/form',
            icon: <SidebarIcon icon={<Captions />} />,
          },
        ],
      }}
    >
      {children}
    </DocsLayout>
  )
}

function SidebarIcon({ icon }: { icon: React.ReactNode }) {
  const color = 'var(--color-fd-primary)'
  return (
    <div
      className="rounded-md p-1 shadow-lg ring-2 [&_svg]:size-5"
      style={
        {
          color,
          border: `1px solid color-mix(in oklab, ${color} 50%, transparent)`,
          '--tw-ring-color': `color-mix(in oklab, ${color} 20%, transparent)`,
        } as object
      }
    >
      {icon}
    </div>
  )
}
