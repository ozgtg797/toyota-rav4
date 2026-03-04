import { NextRequest, NextResponse } from 'next/server'
import { searchChunks } from '@/lib/search/query'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }

  try {
    const chunks = await searchChunks(query.trim())
    return NextResponse.json({ chunks, count: chunks.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
