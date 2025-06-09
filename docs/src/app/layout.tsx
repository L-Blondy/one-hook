import './global.css'
import { Providers } from './providers'
import { RootProvider } from 'fumadocs-ui/provider'
import { Inter } from 'next/font/google'
import React from 'react'
import { headers } from 'next/headers'

const inter = Inter({
  subsets: ['latin'],
})

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const serverCookies = (await headers()).get('cookie')

  return (
    <Providers serverCookies={serverCookies}>
      <html lang="en" className={inter.className} suppressHydrationWarning>
        <body className="flex min-h-screen flex-col">
          <RootProvider>{children}</RootProvider>
        </body>
      </html>
    </Providers>
  )
}
