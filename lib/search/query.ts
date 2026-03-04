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

  const expanded = response.content[0].type === 'text' ? response.content[0].text.trim() : query
  // Combine original query with expanded terms as OR search
  return `${query} ${expanded}`
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

  return (data || []) as ChunkWithDocument[]
}
