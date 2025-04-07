import Link from 'fumadocs-core/link'

export default function Homepage() {
  return (
    <div className="grid min-h-screen place-content-center">
      <Link
        className="bg-fd-primary rounded-full px-4 py-2 text-white"
        children="Get Started"
        href="/docs"
      />
      <input type="text" className="rounded-md border-2 border-gray-300 p-2" />
      <input type="text" className="rounded-md border-2 border-gray-300 p-2" />
    </div>
  )
}
