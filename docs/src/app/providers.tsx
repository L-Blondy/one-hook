'use client'
import { ServerCookieProvider } from '@1hook/use-cookie'

type Props = {
  children: React.ReactNode
  serverCookies: string | null
}

export function Providers({ children, serverCookies }: Props) {
  return (
    <ServerCookieProvider value={serverCookies}>
      {children}
    </ServerCookieProvider>
  )
}
