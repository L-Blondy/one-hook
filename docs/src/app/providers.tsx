'use client'
import { ServerCookie } from '@1hook/use-cookie'

type Props = {
  children: React.ReactNode
  serverCookies: string
}

export function Providers({ children, serverCookies }: Props) {
  return (
    <ServerCookie.Provider value={serverCookies}>
      {children}
    </ServerCookie.Provider>
  )
}
