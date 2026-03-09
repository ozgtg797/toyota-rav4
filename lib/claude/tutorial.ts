import JSON5 from 'json5'
import Anthropic from '@anthropic-ai/sdk'
import { getAnthropicClient } from './client'
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts'
import { ChunkWithDocument, Tutorial, TutorialStep, Warning } from '@/lib/types'
import { createAdminClient } from '@/lib/supabase/admin'

interface GeneratedTutorialData {
  title: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  time_estimate: string
  overview: string
  tools: string[]
  parts: Array<{ name: string; quantity: string; part_number?: string }>
  top_warnings: Array<{ type: string; message: string }>
  steps: TutorialStep[]
  post_checks: string[]
  notes: string
  sources: Array<{ document_name: string; section: string; pages: string }>
}

const VALID_WARNING_TYPES = new Set(['danger', 'warning', 'caution', 'note'])

function sanitizeWarnings(warnings: Array<{ type: string; message: string }>): Warning[] {
  return warnings.map((w) => ({
    type: VALID_WARNING_TYPES.has(w.type) ? (w.type as Warning['type']) : 'note',
    message: w.message,
  }))
}

export async function generateTutorial(
  query: string,
  chunks: ChunkWithDocument[]
): Promise<Omit<Tutorial, 'id' | 'generated_at' | 'view_count'>> {
  const anthropic = getAnthropicClient()
  const supabase = createAdminClient()

  // Get unique documents with anthropic_file_id and page_count ≤ 100 (Anthropic Files API limit)
  const docPageCounts = new Map<string, number>()
  const { data: docRows } = await supabase
    .from('documents')
    .select('id, page_count')
    .in('id', [...new Set(chunks.map(c => c.document_id))])
  for (const d of docRows || []) docPageCounts.set(d.id, d.page_count || 999)

  const docsWithFiles = new Map<string, string>()
  for (const chunk of chunks) {
    const pages = docPageCounts.get(chunk.document_id) ?? 999
    if (chunk.documents?.anthropic_file_id && pages <= 100 && !docsWithFiles.has(chunk.document_id)) {
      docsWithFiles.set(chunk.document_id, chunk.documents.anthropic_file_id)
    }
  }

  const hasFiles = docsWithFiles.size > 0

  let rawText: string

  if (hasFiles) {
    // Use beta files API for vision-capable documents
    const contentBlocks: Anthropic.Beta.BetaContentBlockParam[] = []

    for (const [, fileId] of Array.from(docsWithFiles.entries())) {
      contentBlocks.push({
        type: 'document',
        source: {
          type: 'file',
          file_id: fileId,
        },
      } as Anthropic.Beta.BetaRequestDocumentBlock)
    }

    contentBlocks.push({
      type: 'text',
      text: buildUserPrompt(query, chunks),
    })

    const response = await anthropic.beta.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contentBlocks }],
      betas: ['files-api-2025-04-14'],
    })

    rawText = response.content[0].type === 'text' ? response.content[0].text : ''
  } else {
    // Standard text-only mode
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(query, chunks),
        },
      ],
    })

    rawText = response.content[0].type === 'text' ? response.content[0].text : ''
  }

  // Parse with JSON5 for resilience
  let parsed: GeneratedTutorialData
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    parsed = JSON5.parse(jsonMatch[0])
  } catch (err) {
    throw new Error(`Failed to parse tutorial JSON: ${err instanceof Error ? err.message : String(err)}`)
  }

  // Resolve page_images storage paths from DB
  const resolvedSteps = await resolvePageImages(parsed.steps || [], supabase)

  const queryNormalized = query.toLowerCase().trim().replace(/\s+/g, ' ')

  return {
    query,
    query_normalized: queryNormalized,
    chunk_ids: chunks.map((c) => c.id),
    title: parsed.title || query,
    difficulty: parsed.difficulty || null,
    time_estimate: parsed.time_estimate || null,
    overview: parsed.overview || null,
    tools: parsed.tools || [],
    parts: parsed.parts || [],
    top_warnings: sanitizeWarnings(parsed.top_warnings || []),
    steps: resolvedSteps,
    post_checks: parsed.post_checks || [],
    notes: parsed.notes || null,
    sources: parsed.sources || [],
  }
}

async function resolvePageImages(
  steps: TutorialStep[],
  supabase: ReturnType<typeof createAdminClient>
): Promise<TutorialStep[]> {
  const pageRefs = new Set<string>()
  for (const step of steps) {
    for (const img of step.page_images || []) {
      if (img.document_id && img.page_number) {
        pageRefs.add(`${img.document_id}:${img.page_number}`)
      }
    }
  }

  if (pageRefs.size === 0) return steps

  const { data: pages } = await supabase
    .from('document_pages')
    .select('document_id, page_number, storage_path')

  const pageMap = new Map<string, string>()
  for (const page of pages || []) {
    pageMap.set(`${page.document_id}:${page.page_number}`, page.storage_path)
  }

  return steps.map((step) => ({
    ...step,
    warnings: sanitizeWarnings(step.warnings || []),
    page_images: (step.page_images || [])
      .map((img) => ({
        ...img,
        storage_path: pageMap.get(`${img.document_id}:${img.page_number}`) || '',
      }))
      .filter((img) => img.storage_path),
  }))
}
