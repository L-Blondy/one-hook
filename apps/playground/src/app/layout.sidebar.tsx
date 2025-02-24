'use client'
import Link, { type LinkProps } from 'next/link'
import React, { type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from 'src/utils/cn'

export const LayoutSidebar = () => {
  return (
    <nav className="w-82 sticky top-0 h-screen bg-slate-50 shadow-lg">
      <ul className="h-full overflow-scroll px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          1hook
        </Link>

        <div className="mt-6 flex flex-col gap-4 font-mono">
          <NavLink
            href="/use-cookie"
            children="use-cookie"
            activeClassName="text-teal-600"
          />
          <NavLink
            href="/use-storage"
            children="use-storage"
            activeClassName="text-teal-600"
          />
        </div>
      </ul>
    </nav>
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
