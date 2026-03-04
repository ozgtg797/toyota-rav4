'use client'

import { useState } from 'react'
import { PageImageRef } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface DiagramImageProps {
  image: PageImageRef
  stepNumber: number
}

function getPublicUrl(storagePath: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from('pages').getPublicUrl(storagePath)
  return data.publicUrl
}

export function DiagramImage({ image, stepNumber }: DiagramImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [imgError, setImgError] = useState(false)

  if (!image.storage_path || imgError) return null

  const url = getPublicUrl(image.storage_path)

  return (
    <>
      <div className="diagram-image my-3">
        <button
          onClick={() => setLightboxOpen(true)}
          className="w-full block focus:outline-none focus:ring-2 focus:ring-blue-400 rounded overflow-hidden"
          aria-label={`Step ${stepNumber} diagram - page ${image.page_number}. Tap to zoom.`}
        >
          <img
            src={url}
            alt={`Step ${stepNumber} diagram - page ${image.page_number}`}
            className="w-full h-auto object-contain rounded border border-gray-200 max-h-64"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          <p className="text-xs text-gray-500 text-center mt-1">
            Page {image.page_number} — tap to zoom
          </p>
        </button>
      </div>

      {lightboxOpen && (
        <div
          className="lightbox fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl leading-none"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
          <img
            src={url}
            alt={`Step ${stepNumber} diagram - page ${image.page_number}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
