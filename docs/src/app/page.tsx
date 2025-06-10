'use client'
import Link from 'fumadocs-core/link'

export default function Homepage() {
  return (
    <div className="flex min-h-screen flex-col place-content-center items-center justify-center gap-2">
      <Link
        className="bg-fd-primary rounded-full px-4 py-2 text-white"
        children="Get Started"
        href="/docs"
      />
    </div>
  )
}
