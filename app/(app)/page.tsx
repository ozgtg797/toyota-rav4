import { SearchBar } from '@/components/search/SearchBar'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🚗</div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          RAV4 Maintenance Guide
        </h1>
        <p className="text-gray-500 text-lg">
          1997 Toyota RAV4 · Factory Service Manual
        </p>
      </div>

      <SearchBar autoFocus />

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400 mb-4">Popular searches</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['oil change', 'spark plugs', 'brake pads', 'timing belt', 'coolant flush'].map((q) => (
            <a
              key={q}
              href={`/search?q=${encodeURIComponent(q)}`}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-gray-400 transition-colors"
            >
              {q}
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
