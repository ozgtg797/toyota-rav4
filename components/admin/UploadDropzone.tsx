'use client'

import { useState, useCallback } from 'react'

interface UploadDropzoneProps {
  adminSecret: string
  onSuccess: (documentId: string) => void
}

interface UploadState {
  status: 'idle' | 'preparing' | 'uploading' | 'processing' | 'done' | 'error'
  progress: number
  message: string
  documentId?: string
}

export function UploadDropzone({ adminSecret, onSuccess }: UploadDropzoneProps) {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    message: '',
  })
  const [displayName, setDisplayName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setState({ status: 'error', progress: 0, message: 'Only PDF files are supported.' })
      return
    }
    if (f.size > 60 * 1024 * 1024) {
      setState({
        status: 'error',
        progress: 0,
        message: 'File too large (max 60MB). Please split the PDF by chapter first.',
      })
      return
    }
    setFile(f)
    if (!displayName) setDisplayName(f.name.replace('.pdf', '').replace(/[-_]/g, ' '))
    setState({ status: 'idle', progress: 0, message: '' })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const handleUpload = async () => {
    if (!file || !displayName.trim()) return

    try {
      setState({ status: 'preparing', progress: 5, message: 'Preparing upload...' })

      // Step 1: Get signed URL
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          displayName: displayName.trim(),
        }),
      })

      const uploadData = await res.json()
      if (!res.ok) throw new Error(uploadData.error)

      // Step 2: Upload directly to Supabase Storage
      setState({ status: 'uploading', progress: 20, message: 'Uploading PDF...' })

      const uploadRes = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'application/pdf' },
      })

      if (!uploadRes.ok) throw new Error('Upload failed')

      // Step 3: Trigger processing
      setState({ status: 'processing', progress: 50, message: 'Processing PDF — extracting text and rendering pages...' })

      const processRes = await fetch('/api/admin/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({ documentId: uploadData.documentId }),
      })

      const processData = await processRes.json()
      if (!processRes.ok) throw new Error(processData.error)

      setState({
        status: 'done',
        progress: 100,
        message: `Done! ${processData.chunkCount} chunks, ${processData.pagesRendered} pages rendered.`,
        documentId: uploadData.documentId,
      })

      setFile(null)
      setDisplayName('')
      onSuccess(uploadData.documentId)
    } catch (err) {
      setState({
        status: 'error',
        progress: 0,
        message: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }

  const isLoading = ['preparing', 'uploading', 'processing'].includes(state.status)

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          id="pdf-input"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
        />
        <label htmlFor="pdf-input" className="cursor-pointer">
          <div className="text-4xl mb-2">📄</div>
          {file ? (
            <p className="text-gray-900 font-medium">{file.name}</p>
          ) : (
            <>
              <p className="text-gray-700 font-medium">Drop PDF here or click to select</p>
              <p className="text-gray-400 text-sm mt-1">Max 60MB per file</p>
            </>
          )}
        </label>
      </div>

      {/* Display name */}
      {file && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Engine Mechanical Chapter"
          />
        </div>
      )}

      {/* Progress / status */}
      {state.status !== 'idle' && (
        <div>
          {isLoading && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          )}
          <p className={`text-sm ${state.status === 'error' ? 'text-red-600' : state.status === 'done' ? 'text-green-600' : 'text-gray-600'}`}>
            {state.message}
          </p>
        </div>
      )}

      {/* Upload button */}
      {file && !isLoading && state.status !== 'done' && (
        <button
          onClick={handleUpload}
          disabled={!displayName.trim()}
          className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Upload & Process PDF
        </button>
      )}
    </div>
  )
}
