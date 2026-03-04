'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UploadDropzone } from '@/components/admin/UploadDropzone'

export default function UploadPage() {
  const [secret, setSecret] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [successIds, setSuccessIds] = useState<string[]>([])

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Admin Access</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (secret.trim()) setAuthenticated(true)
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
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-gray-400 hover:text-gray-600">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900">Upload PDF</h1>
      </div>

      <UploadDropzone
        adminSecret={secret}
        onSuccess={(id) => setSuccessIds((prev) => [...prev, id])}
      />

      {successIds.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium mb-2">
            ✅ {successIds.length} document{successIds.length > 1 ? 's' : ''} processed successfully
          </p>
          <Link href="/admin/documents" className="text-green-700 text-sm underline">
            View documents →
          </Link>
        </div>
      )}
    </div>
  )
}
