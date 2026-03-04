import { PDFParse } from 'pdf-parse'

export interface ExtractedPage {
  pageNumber: number
  text: string
  charCount: number
}

export interface ExtractionResult {
  pages: ExtractedPage[]
  totalPages: number
  totalChars: number
  avgCharsPerPage: number
  isLikelyScanned: boolean
  fullText: string
}

export async function extractText(buffer: Buffer): Promise<ExtractionResult> {
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()

  const pages: ExtractedPage[] = result.pages.map((p) => ({
    pageNumber: p.num,
    text: p.text.trim(),
    charCount: p.text.trim().length,
  }))

  const totalPages = result.total
  const fullText = result.text
  const totalChars = fullText.length
  const avgCharsPerPage = totalPages > 0 ? Math.round(totalChars / totalPages) : 0
  const isLikelyScanned = avgCharsPerPage < 100

  return {
    pages,
    totalPages,
    totalChars,
    avgCharsPerPage,
    isLikelyScanned,
    fullText,
  }
}

// Strip repeating headers/footers by detecting lines that appear on many pages
export function stripHeadersFooters(pages: ExtractedPage[]): ExtractedPage[] {
  if (pages.length < 3) return pages

  const firstLines = new Map<string, number>()
  const lastLines = new Map<string, number>()

  for (const page of pages) {
    const lines = page.text.split('\n').filter((l) => l.trim())
    if (lines.length > 0) {
      const first = lines[0].trim()
      const last = lines[lines.length - 1].trim()
      if (first) firstLines.set(first, (firstLines.get(first) || 0) + 1)
      if (last) lastLines.set(last, (lastLines.get(last) || 0) + 1)
    }
  }

  const threshold = Math.max(3, Math.floor(pages.length * 0.3))
  const headerPatterns = new Set<string>()
  const footerPatterns = new Set<string>()

  for (const [line, count] of Array.from(firstLines.entries())) {
    if (count >= threshold) headerPatterns.add(line)
  }
  for (const [line, count] of Array.from(lastLines.entries())) {
    if (count >= threshold) footerPatterns.add(line)
  }

  if (headerPatterns.size === 0 && footerPatterns.size === 0) return pages

  return pages.map((page) => {
    const lines = page.text.split('\n')
    const filtered = lines.filter((line) => {
      const trimmed = line.trim()
      return !headerPatterns.has(trimmed) && !footerPatterns.has(trimmed)
    })
    const text = filtered.join('\n').trim()
    return { ...page, text, charCount: text.length }
  })
}
