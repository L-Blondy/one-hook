'use client'
import { defineResizable } from 'crustack/resizable'
import { useCookie } from './cookies'
import Link, { LinkProps } from 'next/link'
import React, { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from 'crustack/utils'

const resizable = defineResizable()

export const LayoutSidebar = () => {
  const [width, setWidth] = useCookie('sidebar-width')

  return (
    <resizable.Root
      asChild
      style={{
        minWidth: '4rem',
        maxWidth: 'calc(100% - 4rem)',
      }}
      size={{ width }}
      className="sticky top-0 h-screen bg-slate-50 shadow-lg"
      onResize={({ width }) => setWidth(width)}
    >
      <nav>
        <resizable.Handle
          ratio={{ width: 1, height: 0 }}
          cursor="col-resize"
          className="absolute right-0 top-0 z-10 h-full w-1.5 translate-x-1/2 overflow-auto transition hover:bg-teal-700/30 data-[active]:bg-teal-700/50"
        />
        <ul className="h-full overflow-scroll px-4 py-3">
          <Link href="/" className="text-lg font-semibold">
            Crustack
          </Link>

          <div className="mt-6 flex flex-col gap-4 font-mono">
            <NavLink
              href="/use-cookie"
              children="use-cookie"
              activeClassName="text-teal-600"
            />
          </div>
        </ul>
      </nav>
    </resizable.Root>
  )
}

function NavLink<RouteType>({
  activeClassName,
  className,
  ...props
}: LinkProps<RouteType> & {
  className?: string
  activeClassName?: string
  children?: ReactNode
}) {
  const pathname = usePathname()
  const active =
    typeof props.href === 'string'
      ? props.href === pathname
      : props.href.pathname === pathname

  return (
    <Link {...props} className={cn(className, active && activeClassName)} />
  )
}
