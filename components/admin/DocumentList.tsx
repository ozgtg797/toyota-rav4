'use client'

import { useState } from 'react'
import { Document } from '@/lib/types'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface DocumentListProps {
  documents: Document[]
  adminSecret: string
  onDelete: (id: string) => void
}

export function DocumentList({ documents, adminSecret, onDelete }: DocumentListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will remove all chunks and page images.`)) return

    setDeleting(id)
    try {
      const res = await fetch('/api/admin/documents', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({ documentId: id }),
      })
      if (res.ok) onDelete(id)
    } finally {
      setDeleting(null)
    }
  }

  if (documents.length === 0) {
    return <p className="text-gray-500 text-center py-8">No documents uploaded yet.</p>
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{doc.display_name}</p>
              <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{doc.name}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                <span>{formatSize(doc.file_size)}</span>
                {doc.page_count && <span>{doc.page_count} pages</span>}
                {doc.chunk_count > 0 && <span>{doc.chunk_count} chunks</span>}
                {doc.anthropic_file_id && (
                  <span className="text-purple-600">✓ Vision enabled</span>
                )}
              </div>
              {doc.error_message && (
                <p className="text-xs text-red-600 mt-1">{doc.error_message}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[doc.status]}`}>
                {doc.status}
              </span>
              <button
                onClick={() => handleDelete(doc.id, doc.display_name)}
                disabled={deleting === doc.id}
                className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting === doc.id ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
