import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function verifyAdmin(req: NextRequest): boolean {
  const secret = req.headers.get('x-admin-secret')
  return secret === process.env.ADMIN_SECRET
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: data })
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { documentId } = await req.json()
  if (!documentId) return NextResponse.json({ error: 'Missing documentId' }, { status: 400 })

  const supabase = createAdminClient()

  // Get document info first
  const { data: doc } = await supabase.from('documents').select('*').eq('id', documentId).single()

  if (doc) {
    // Delete PDF from storage
    await supabase.storage.from('documents').remove([doc.storage_path])

    // Delete page images
    const { data: pages } = await supabase
      .from('document_pages')
      .select('storage_path')
      .eq('document_id', documentId)

    if (pages && pages.length > 0) {
      await supabase.storage
        .from('pages')
        .remove(pages.map((p) => p.storage_path))
    }
  }

  const { error } = await supabase.from('documents').delete().eq('id', documentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
