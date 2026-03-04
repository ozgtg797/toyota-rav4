'use client'

import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">🔧</span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">1997 Toyota RAV4 Manual Manager</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/upload"
          className="block bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gray-400 transition-colors group"
        >
          <div className="text-3xl mb-3">📤</div>
          <h2 className="font-bold text-gray-900 group-hover:text-blue-600">Upload PDF</h2>
          <p className="text-sm text-gray-500 mt-1">Add a new factory service manual chapter</p>
        </Link>

        <Link
          href="/admin/documents"
          className="block bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-gray-400 transition-colors group"
        >
          <div className="text-3xl mb-3">📚</div>
          <h2 className="font-bold text-gray-900 group-hover:text-blue-600">Manage Documents</h2>
          <p className="text-sm text-gray-500 mt-1">View, reprocess, or delete uploaded PDFs</p>
        </Link>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-medium mb-1">Getting Started</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Split large PDFs by chapter (max 60MB each)</li>
          <li>Upload each chapter with a descriptive name</li>
          <li>Wait for processing to complete (1-5 min per file)</li>
          <li>Search for procedures on the main page</li>
        </ol>
      </div>
    </div>
  )
}
