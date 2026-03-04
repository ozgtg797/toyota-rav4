import { NextRequest, NextResponse } from 'next/server'
import { searchChunks } from '@/lib/search/query'
import { generateTutorial } from '@/lib/claude/tutorial'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { query } = await req.json()

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: 'Query too short' }, { status: 400 })
  }

  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ')
  const supabase = createAdminClient()

  // Check cache first
  const { data: cached } = await supabase
    .from('tutorials')
    .select('*')
    .eq('query_normalized', normalizedQuery)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  if (cached) {
    // Increment view count
    await supabase
      .from('tutorials')
      .update({ view_count: cached.view_count + 1 })
      .eq('id', cached.id)

    return NextResponse.json({ tutorial: cached, cached: true })
  }

  // Search for relevant chunks
  const chunks = await searchChunks(query.trim())

  if (chunks.length === 0) {
    return NextResponse.json(
      { error: 'No relevant content found in the manuals for this query.' },
      { status: 404 }
    )
  }

  // Generate tutorial with Claude
  const tutorialData = await generateTutorial(query, chunks)

  // Cache to DB
  const { data: saved, error: saveError } = await supabase
    .from('tutorials')
    .insert(tutorialData)
    .select()
    .single()

  if (saveError) {
    // Return the tutorial even if caching failed
    return NextResponse.json({ tutorial: { ...tutorialData, id: 'uncached' }, cached: false })
  }

  return NextResponse.json({ tutorial: saved, cached: false })
}
