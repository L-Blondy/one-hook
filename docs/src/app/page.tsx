'use client'
import { defineCookie } from '@1hook/use-cookie'
import Link from 'fumadocs-core/link'
import { z } from 'zod'

const [useCount] = defineCookie({
  name: 'count',
  validate: z.number().default(0),
})

export default function Homepage() {
  const [count, setCount] = useCount()

  return (
    <div className="flex min-h-screen flex-col place-content-center items-center justify-center gap-2">
      <Link
        className="bg-fd-primary rounded-full px-4 py-2 text-white"
        children="Get Started"
        href="/docs"
      />

      <button
        onClick={() => setCount((c) => ++c)}
        className="bg-fd-secondary rounded-full px-4 py-2"
      >
        Increment {count}
      </button>
    </div>
  )
}
