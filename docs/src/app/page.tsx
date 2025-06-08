'use client'
import Link from 'fumadocs-core/link'
import { defineStore, cookie } from '@1hook/use-store'
import { z } from 'zod'

const [useCount] = defineStore({
  storage: cookie({
    name: 'count',
    validate: z.number().default(0),
  }),
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
