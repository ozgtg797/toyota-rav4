import { createAdminClient } from '@/lib/supabase/admin'
import { extractText, stripHeadersFooters } from './extract'
import { chunkPages, TextChunk } from './chunk'
import { renderPages } from './render-pages'
import Anthropic from '@anthropic-ai/sdk'

const MAX_ANTHROPIC_FILE_SIZE = 32 * 1024 * 1024 // 32MB

export interface PipelineResult {
  pageCount: number
  chunkCount: number
  pagesRendered: number
  anthropicFileId: string | null
}

export async function processPDF(documentId: string): Promise<PipelineResult> {
  const supabase = createAdminClient()
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // 1. Fetch document record
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (docError || !doc) throw new Error(`Document not found: ${documentId}`)

  // 2. Update status to processing
  await supabase
    .from('documents')
    .update({ status: 'processing' })
    .eq('id', documentId)

  try {
    // 3. Download PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.storage_path)

    if (downloadError || !fileData) throw new Error(`Failed to download PDF: ${downloadError?.message}`)

    const buffer = Buffer.from(await fileData.arrayBuffer())

    // 4. Upload to Anthropic Files API if ≤ 32MB
    let anthropicFileId: string | null = null
    if (buffer.length <= MAX_ANTHROPIC_FILE_SIZE) {
      const file = new File([buffer], doc.name, { type: 'application/pdf' })
      const uploaded = await anthropic.beta.files.upload({ file })
      anthropicFileId = uploaded.id
    }

    // 5. Extract text
    const extraction = await extractText(buffer)
    const cleanedPages = stripHeadersFooters(extraction.pages)

    // 6. Chunk text
    const chunks = chunkPages(cleanedPages)

    // 7. Determine which pages to render
    const pagesToRender = new Set<number>()
    for (const chunk of chunks) {
      if (chunk.pageStart) {
        for (let p = chunk.pageStart; p <= (chunk.pageEnd || chunk.pageStart); p++) {
          pagesToRender.add(p)
        }
      }
    }

    // 8. Render pages and upload to Supabase Storage
    let pagesRendered = 0
    if (pagesToRender.size > 0) {
      const rendered = await renderPages(buffer, Array.from(pagesToRender))

      for (const page of rendered) {
        const storagePath = `${documentId}/${page.pageNumber}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('pages')
          .upload(storagePath, page.buffer, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (!uploadError) {
          await supabase.from('document_pages').upsert({
            document_id: documentId,
            page_number: page.pageNumber,
            storage_path: storagePath,
            width: page.width,
            height: page.height,
          })
          pagesRendered++
        }
      }
    }

    // 9. Insert chunks into DB
    const chunkRows = chunks.map((chunk: TextChunk) => ({
      document_id: documentId,
      chunk_index: chunk.chunkIndex,
      page_start: chunk.pageStart,
      page_end: chunk.pageEnd,
      section_heading: chunk.sectionHeading,
      subsection: chunk.subsection,
      content: chunk.content,
    }))

    if (chunkRows.length > 0) {
      // Insert in batches of 100
      for (let i = 0; i < chunkRows.length; i += 100) {
        await supabase.from('chunks').insert(chunkRows.slice(i, i + 100))
      }
    }

    // 10. Update document as ready
    await supabase
      .from('documents')
      .update({
        status: 'ready',
        anthropic_file_id: anthropicFileId,
        page_count: extraction.totalPages,
        chunk_count: chunks.length,
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    return {
      pageCount: extraction.totalPages,
      chunkCount: chunks.length,
      pagesRendered,
      anthropicFileId,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase
      .from('documents')
      .update({ status: 'error', error_message: message })
      .eq('id', documentId)
    throw err
  }
}
