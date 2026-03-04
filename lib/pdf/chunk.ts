import { ExtractedPage } from './extract'

export interface TextChunk {
  chunkIndex: number
  pageStart: number
  pageEnd: number
  sectionHeading: string | null
  subsection: string | null
  content: string
}

// Toyota FSM section heading patterns
const SECTION_PATTERNS = [
  // ALL CAPS headings (e.g. "ENGINE MECHANICAL", "COOLING SYSTEM")
  /^[A-Z][A-Z\s\-–—]{4,}$/,
  // Numbered sections (e.g. "3.4 OIL PUMP", "1.2.3 Disassembly")
  /^\d+(\.\d+)*\s+[A-Z]/,
  // Toyota FSM keywords
  /^(REMOVAL|INSTALLATION|INSPECTION|DISASSEMBLY|REASSEMBLY|ADJUSTMENT|PREPARATION|TROUBLESHOOTING|SPECIFICATIONS?|COMPONENTS?|NOTICE|CAUTION|WARNING|NOTE)\b/i,
  // Chapter-style headings
  /^(Chapter|Section|Part)\s+\d+/i,
]

function isHeading(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < 3 || trimmed.length > 80) return false
  return SECTION_PATTERNS.some((p) => p.test(trimmed))
}

function detectHeadings(text: string): { heading: string | null; subsection: string | null } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  let heading: string | null = null
  let subsection: string | null = null

  for (const line of lines.slice(0, 5)) {
    if (isHeading(line)) {
      if (!heading) {
        heading = line
      } else if (!subsection) {
        subsection = line
        break
      }
    }
  }

  return { heading, subsection }
}

export function chunkPages(
  pages: ExtractedPage[],
  options: {
    targetChars?: number
    maxChars?: number
    overlapChars?: number
  } = {}
): TextChunk[] {
  const { targetChars = 1500, maxChars = 3000, overlapChars = 200 } = options

  const chunks: TextChunk[] = []
  let currentText = ''
  let currentPageStart = 1
  let currentPageEnd = 1
  let chunkIndex = 0
  let overlapText = ''

  const flushChunk = (pageEnd: number) => {
    if (currentText.trim().length === 0) return

    const { heading, subsection } = detectHeadings(currentText)

    chunks.push({
      chunkIndex: chunkIndex++,
      pageStart: currentPageStart,
      pageEnd,
      sectionHeading: heading,
      subsection,
      content: currentText.trim(),
    })

    // Keep overlap for next chunk
    const words = currentText.split(/\s+/)
    overlapText = words.slice(-Math.floor(overlapChars / 5)).join(' ')
    currentText = ''
  }

  for (const page of pages) {
    if (!page.text.trim()) continue

    const lines = page.text.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Check if this is a new major section heading — force a chunk break
      if (isHeading(trimmed) && currentText.length > targetChars * 0.3) {
        flushChunk(currentPageEnd)
        currentPageStart = page.pageNumber
        currentText = overlapText ? overlapText + '\n' + trimmed : trimmed
      } else {
        currentText += (currentText ? '\n' : '') + trimmed
      }

      currentPageEnd = page.pageNumber

      // Flush when we hit max size
      if (currentText.length >= maxChars) {
        flushChunk(page.pageNumber)
        currentPageStart = page.pageNumber
        currentText = overlapText
      }
    }

    // Flush if we've accumulated enough for a good chunk at page boundary
    if (currentText.length >= targetChars) {
      flushChunk(page.pageNumber)
      currentPageStart = page.pageNumber + 1
      currentText = overlapText
    }
  }

  // Final chunk
  if (currentText.trim()) {
    flushChunk(currentPageEnd)
  }

  return chunks
}
