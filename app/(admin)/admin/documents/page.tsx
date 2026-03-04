'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Document } from '@/lib/types'
import { DocumentList } from '@/components/admin/DocumentList'

export default function DocumentsPage() {
  const [secret, setSecret] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDocs = async (s: string) => {
    setLoading(true)
    const res = await fetch('/api/admin/documents', {
      headers: { 'x-admin-secret': s },
    })
    const data = await res.json()
    if (res.ok) setDocuments(data.documents || [])
    setLoading(false)
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Admin Access</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (secret.trim()) {
              setAuthenticated(true)
              await fetchDocs(secret)
            }
          }}
          className="space-y-4"
        >
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin secret"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700"
          >
            Enter
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600">← Back</Link>
          <h1 className="text-xl font-bold text-gray-900">Documents</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDocs(secret)}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg"
          >
            Refresh
          </button>
          <Link
            href="/admin/upload"
            className="text-sm bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700"
          >
            + Upload
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <DocumentList
          documents={documents}
          adminSecret={secret}
          onDelete={(id) => setDocuments((prev) => prev.filter((d) => d.id !== id))}
        />
      )}
    </div>
  )
}
