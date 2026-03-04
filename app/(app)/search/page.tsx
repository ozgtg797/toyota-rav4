'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/search/SearchBar'
import { Tutorial } from '@/lib/types'
import { TutorialViewer } from '@/components/tutorial/TutorialViewer'
import { Suspense } from 'react'

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [tutorial, setTutorial] = useState<Tutorial | null>(null)
  const [error, setError] = useState('')

  const generate = useCallback(async () => {
    if (!query.trim()) return
    setStatus('loading')
    setError('')
    setTutorial(null)

    try {
      const res = await fetch('/api/tutorial/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setTutorial(data.tutorial)
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }, [query])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (query) generate() }, [query])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <a href="/" className="text-2xl">🚗</a>
          <div className="flex-1">
            <SearchBar initialQuery={query} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {status === 'loading' && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin text-4xl mb-4">⚙️</div>
            <p className="text-gray-600 font-medium">Generating tutorial from factory manual...</p>
            <p className="text-gray-400 text-sm mt-2">This may take 30-60 seconds</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-medium mb-2">Could not generate tutorial</p>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={generate}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {status === 'done' && tutorial && (
          <TutorialViewer tutorial={tutorial} />
        )}

        {status === 'idle' && !query && (
          <div className="text-center py-16 text-gray-400">
            Enter a search term above to get started
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin text-4xl">⚙️</div></div>}>
      <SearchContent />
    </Suspense>
  )
}
