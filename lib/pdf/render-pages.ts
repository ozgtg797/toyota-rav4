// Server-side PDF page rendering using pdfjs-dist + canvas
import { createCanvas } from 'canvas'

export interface RenderedPage {
  pageNumber: number
  buffer: Buffer
  width: number
  height: number
}

export async function renderPage(
  pdfBuffer: Buffer,
  pageNumber: number,
  dpi = 150
): Promise<RenderedPage> {
  // Dynamic import to avoid issues with pdfjs-dist ESM in CJS context
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const data = new Uint8Array(pdfBuffer)
  const loadingTask = pdfjs.getDocument({ data, disableStream: true, disableAutoFetch: true })
  const pdfDoc = await loadingTask.promise

  const page = await pdfDoc.getPage(pageNumber)
  const viewport = page.getViewport({ scale: dpi / 72 })

  const canvas = createCanvas(viewport.width, viewport.height)
  const context = canvas.getContext('2d')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (page as any).render({
    canvasContext: context,
    viewport,
  }).promise

  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.8 })

  return {
    pageNumber,
    buffer,
    width: viewport.width,
    height: viewport.height,
  }
}

export async function renderPages(
  pdfBuffer: Buffer,
  pageNumbers: number[],
  dpi = 150,
  onProgress?: (current: number, total: number) => void
): Promise<RenderedPage[]> {
  const results: RenderedPage[] = []
  const unique = [...new Set(pageNumbers)].sort((a, b) => a - b)

  for (let i = 0; i < unique.length; i++) {
    const pageNum = unique[i]
    onProgress?.(i + 1, unique.length)
    const rendered = await renderPage(pdfBuffer, pageNum, dpi)
    results.push(rendered)
  }

  return results
}
