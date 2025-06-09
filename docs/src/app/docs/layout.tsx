import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import React from 'react'
import { source } from '@/lib/source'
import { repoUrl } from '@/utils/repo-url'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      githubUrl={repoUrl()}
      nav={{
        title: (
          <>
            <div className="to-fd-primary outline-fd-primary/60 size-5 translate-x-px rounded-full bg-gradient-to-br from-transparent outline" />
            one-hook
          </>
        ),
      }}
      sidebar={{ tabs: false }}
    >
      {children}
    </DocsLayout>
  )
}

// function SidebarIcon({ icon }: { icon: React.ReactNode }) {
//   const color = 'var(--color-fd-primary)'
//   return (
//     <div
//       className="rounded-md p-1 shadow-lg ring-2 [&_svg]:size-5"
//       style={
//         {
//           color,
//           border: `1px solid color-mix(in oklab, ${color} 50%, transparent)`,
//           '--tw-ring-color': `color-mix(in oklab, ${color} 20%, transparent)`,
//         } as object
//       }
//     >
//       {icon}
//     </div>
//   )
// }

// const tabs: SidebarOptions['tabs'] = [
//   {
//     title: 'one-hook',
//     description: 'React hooks',
//     url: '/docs/one-hook',
//     icon: <SidebarIcon icon={<Webhook />} />,
//   },
//   {
//     title: 'one-form',
//     description: 'React form',
//     url: '/docs/one-form',
//     icon: <SidebarIcon icon={<Captions />} />,
//   },
//   {
//     title: 'one-component',
//     description: 'React components',
//     url: '/docs/one-component',
//     icon: <SidebarIcon icon={<Captions />} />,
//   },
// ]
