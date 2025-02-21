import './globals.css'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { LayoutSidebar } from './layout.sidebar'
import { CookieProvider } from './cookies'
import { cookies } from 'next/headers'
import { cn } from 'src/utils/cn'

const geistSans = localFont({
  src: './GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Rebase.io Playground',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const ssrCookies = Object.fromEntries(
    (await cookies()).getAll().map((cookie) => [cookie.name, cookie.value]),
  )

  return (
    <html lang="en">
      <body className={cn(geistSans.variable, 'font-sans antialiased')}>
        <CookieProvider ssrCookies={ssrCookies}>
          <div className="flex min-h-full w-full">
            <LayoutSidebar />
            <main className="p-6">{children}</main>
          </div>
        </CookieProvider>
      </body>
    </html>
  )
}
