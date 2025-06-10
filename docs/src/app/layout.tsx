import './global.css'
import { RootProvider } from 'fumadocs-ui/provider'
import { Inter } from 'next/font/google'
import React from 'react'

const inter = Inter({
  subsets: ['latin'],
})

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
