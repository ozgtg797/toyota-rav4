'use client'

import { useRouter } from 'next/navigation'

interface SearchResultCardProps {
  query: string
  chunkCount: number
  sectionHeading: string | null
  documentName: string
}

export function SearchResultCard({ query, chunkCount, sectionHeading, documentName }: SearchResultCardProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/search?q=${encodeURIComponent(query)}&generate=1`)}
      className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-blue-400 hover:shadow-md active:scale-98 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 capitalize">{query}</p>
          {sectionHeading && (
            <p className="text-sm text-gray-600 mt-1">{sectionHeading}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {documentName} · {chunkCount} relevant section{chunkCount !== 1 ? 's' : ''}
          </p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
