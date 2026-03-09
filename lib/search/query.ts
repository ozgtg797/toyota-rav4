import { createAdminClient } from '@/lib/supabase/admin'
import { ChunkWithDocument } from '@/lib/types'
import { getAnthropicClient } from '@/lib/claude/client'

// Expand query to catch synonyms (e.g. "oil change" → also matches "engine oil replacement")
async function expandQuery(query: string): Promise<string> {
  const anthropic = getAnthropicClient()

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: `For searching a 1997 Toyota RAV4 factory service manual, expand this query into 3-4 key search terms (space-separated, no punctuation): "${query}"
Output ONLY the terms, nothing else.`,
      },
    ],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : query
  // Strip quotes, newlines, special chars — keep only plain words
  const expanded = raw.replace(/["\n\r]/g, ' ').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
  // Use OR between original query and each expanded term for broader recall
  const extraTerms = expanded.split(' ').filter(t => t.length > 3).slice(0, 6).join(' OR ')
  return extraTerms ? `${query} OR ${extraTerms}` : query
}

export async function searchChunks(
  query: string,
  limit = 12
): Promise<ChunkWithDocument[]> {
  const supabase = createAdminClient()

  let searchQuery = query

  // Try to expand for better recall (skip if query is already long)
  if (query.split(' ').length <= 4) {
    try {
      searchQuery = await expandQuery(query)
    } catch {
      // Fallback to original query
    }
  }

  const { data, error } = await supabase
    .from('chunks')
    .select('*, documents(display_name, anthropic_file_id)')
    .textSearch('search_vector', searchQuery, { type: 'websearch', config: 'english' })
    .limit(limit)

  if (error) throw new Error(`Search failed: ${error.message}`)

  // Also run a secondary search with manual-style synonyms to catch lubrication sections
  // (Toyota FSMs use "drain/refill/lubrication" not "change")
  const words = query.toLowerCase().split(' ')
  const manualTerms: string[] = []
  if (words.some(w => ['oil', 'lube', 'lubrication'].includes(w))) manualTerms.push('lubrication drain refill')
  if (words.some(w => ['brake', 'brakes'].includes(w))) manualTerms.push('brake fluid bleeding')
  if (words.some(w => ['coolant', 'antifreeze', 'cooling'].includes(w))) manualTerms.push('coolant drain fill')
  if (words.some(w => ['spark', 'plug', 'plugs'].includes(w))) manualTerms.push('spark plug replacement')

  let secondary: ChunkWithDocument[] = []
  if (manualTerms.length > 0) {
    const { data: data2 } = await supabase
      .from('chunks')
      .select('*, documents(display_name, anthropic_file_id)')
      .textSearch('search_vector', manualTerms.join(' OR '), { type: 'websearch', config: 'english' })
      .limit(limit)
    secondary = (data2 || []) as ChunkWithDocument[]
  }

  // Merge and deduplicate by chunk id, primary results first
  const seen = new Set<string>()
  const merged: ChunkWithDocument[] = []
  for (const chunk of [...(data || []), ...secondary]) {
    if (!seen.has(chunk.id)) {
      seen.add(chunk.id)
      merged.push(chunk)
    }
  }

  return merged.slice(0, limit)
}
