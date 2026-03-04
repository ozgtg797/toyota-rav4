'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const SUGGESTIONS = [
  'oil change',
  'spark plug replacement',
  'air filter',
  'brake pad replacement',
  'coolant flush',
  'timing belt',
  'power steering fluid',
  'transmission fluid',
  'alternator',
  'battery replacement',
]

interface SearchBarProps {
  initialQuery?: string
  autoFocus?: boolean
}

export function SearchBar({ initialQuery = '', autoFocus = false }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query.length > 0
    ? SUGGESTIONS.filter((s) => s.includes(query.toLowerCase()))
    : SUGGESTIONS

  const handleSubmit = (q: string) => {
    if (!q.trim()) return
    setShowSuggestions(false)
    router.push(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="relative w-full max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(query)
        }}
      >
        <div className="flex items-center border-2 border-gray-800 rounded-xl overflow-hidden bg-white shadow-md focus-within:border-blue-500 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="e.g. oil change, brake pads, timing belt..."
            className="flex-1 px-4 py-4 text-base md:text-lg outline-none bg-transparent"
            autoFocus={autoFocus}
            autoComplete="off"
            autoCapitalize="off"
          />
          <button
            type="submit"
            className="bg-gray-800 text-white px-5 py-4 font-semibold hover:bg-gray-700 active:bg-gray-900 transition-colors whitespace-nowrap"
          >
            Search
          </button>
        </div>
      </form>

      {showSuggestions && filtered.length > 0 && query.length >= 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
          {filtered.slice(0, 6).map((s) => (
            <li key={s}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 active:bg-gray-100"
                onMouseDown={() => {
                  setQuery(s)
                  handleSubmit(s)
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
