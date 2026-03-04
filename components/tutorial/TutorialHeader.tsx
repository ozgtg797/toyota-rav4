'use client'

import { useState } from 'react'
import { Tutorial } from '@/lib/types'

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-800',
  Intermediate: 'bg-yellow-100 text-yellow-800',
  Advanced: 'bg-red-100 text-red-800',
}

export function TutorialHeader({ tutorial }: { tutorial: Tutorial }) {
  const [sourcesOpen, setSourcesOpen] = useState(false)

  return (
    <header className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{tutorial.title}</h1>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        {tutorial.difficulty && (
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${DIFFICULTY_COLORS[tutorial.difficulty] || 'bg-gray-100 text-gray-700'}`}>
            {tutorial.difficulty}
          </span>
        )}
        {tutorial.time_estimate && (
          <span className="flex items-center gap-1 text-gray-600 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {tutorial.time_estimate}
          </span>
        )}
        <span className="text-gray-400 text-xs">1997 Toyota RAV4</span>
      </div>

      {tutorial.overview && (
        <p className="text-gray-700 mb-4 leading-relaxed">{tutorial.overview}</p>
      )}

      {tutorial.sources && tutorial.sources.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="w-full flex justify-between items-center p-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span>Sources ({tutorial.sources.length})</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${sourcesOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {sourcesOpen && (
            <ul className="p-3 space-y-1">
              {tutorial.sources.map((src, i) => (
                <li key={i} className="text-xs text-gray-600">
                  <span className="font-medium">{src.document_name}</span>
                  {src.section && <> — {src.section}</>}
                  {src.pages && <span className="text-gray-400"> (pp. {src.pages})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </header>
  )
}
