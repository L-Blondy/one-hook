'use client'
import Link from 'fumadocs-core/link'
import { useState } from 'react'
import { useIsOnline } from '@1hook/use-is-online'

export default function Homepage() {
  const [tab, setTab] = useState(1)
  return (
    <div className="flex min-h-screen flex-col place-content-center items-center justify-center gap-2">
      <Link
        className="bg-fd-primary rounded-full px-4 py-2 text-white"
        children="Get Started"
        href="/docs"
      />
      <button
        className="bg-fd-primary rounded-full px-4 py-2 text-white"
        onClick={() => setTab((n) => ++n % 3)}
      >
        Toggle Tab
      </button>
      {tab === 1 ? <Tab1 /> : tab === 2 ? <Tab2 /> : null}
      {tab ? <TabNull /> : null}
    </div>
  )
}

function Tab1() {
  console.log('tab 1', useIsOnline())
  return <div className="text-2xl">Tab1</div>
}

function Tab2() {
  console.log('tab 2', useIsOnline())
  return <div className="text-2xl">Tab2</div>
}

function TabNull() {
  console.log('tab null', useIsOnline())
  return null
}
