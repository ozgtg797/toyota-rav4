import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function verifyAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret')
  return secret === process.env.ADMIN_SECRET
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { fileName, fileSize, displayName } = await req.json()

  if (!fileName || !fileSize || !displayName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Enforce 60MB limit
  if (fileSize > 60 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File too large. Maximum 60MB. Please split the PDF by chapter first.' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Create document record
  const storagePath = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  const { data: doc, error: dbError } = await supabase
    .from('documents')
    .insert({
      name: fileName,
      display_name: displayName,
      storage_path: storagePath,
      file_size: fileSize,
      status: 'pending',
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // Generate signed upload URL (valid for 1 hour)
  const { data: signedUrl, error: urlError } = await supabase.storage
    .from('documents')
    .createSignedUploadUrl(storagePath)

  if (urlError) {
    return NextResponse.json({ error: urlError.message }, { status: 500 })
  }

  return NextResponse.json({
    documentId: doc.id,
    uploadUrl: signedUrl.signedUrl,
    token: signedUrl.token,
    storagePath,
  })
}
