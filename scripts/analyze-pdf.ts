#!/usr/bin/env ts-node
/**
 * PDF Analyzer Script
 * Run: npm run analyze-pdf -- ./path/to/your.pdf
 * Or:  npx ts-node --project tsconfig.scripts.json scripts/analyze-pdf.ts ./file.pdf
 */

import * as fs from 'fs'
import * as path from 'path'
import { PDFParse } from 'pdf-parse'

const MAX_ANTHROPIC_SIZE = 32 * 1024 * 1024 // 32MB
const MAX_UPLOAD_SIZE = 60 * 1024 * 1024 // 60MB

async function analyzePDF(filePath: string) {
  const absPath = path.resolve(filePath)

  if (!fs.existsSync(absPath)) {
    console.error(`❌ File not found: ${absPath}`)
    process.exit(1)
  }

  const stat = fs.statSync(absPath)
  const fileName = path.basename(absPath)
  const fileSizeMB = (stat.size / (1024 * 1024)).toFixed(1)

  console.log(`\n📄 ${fileName}`)
  console.log(`   Size: ${fileSizeMB}MB (${(stat.size / 1024).toFixed(0)} KB)`)

  if (stat.size > MAX_UPLOAD_SIZE) {
    console.log(`\n   ⛔ TOO LARGE: Exceeds 60MB upload limit.`)
    console.log(`   → Split this PDF by chapter before uploading.`)
    console.log(`   → Use: brew install poppler && pdfseparate file.pdf page-%d.pdf`)
    console.log(`   → Or use Adobe Acrobat / PDF Expert to split by chapter.`)
    return
  }

  const buffer = fs.readFileSync(absPath)

  console.log(`   Analyzing...`)

  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()

  const totalPages = result.total
  const fullText = result.text
  const totalChars = fullText.length
  const avgCharsPerPage = totalPages > 0 ? Math.round(totalChars / totalPages) : 0

  const lowTextPages = result.pages.filter((p) => p.text.trim().length < 50).length

  console.log(`   Pages: ${totalPages}`)

  if (avgCharsPerPage < 100) {
    console.log(`\n   ⛔ SCANNED PDF — avg ${avgCharsPerPage} chars/page`)
    console.log(`   → This PDF has no extractable text (likely scanned images).`)
    console.log(`   → OCR is required before uploading. Recommended: Adobe Acrobat or tesseract.`)
    console.log(`   → Toyota RAV4 FSMs from CD-ROM are typically text-based — check your source.`)
  } else if (avgCharsPerPage < 300) {
    console.log(`   ⚠  Mixed content — avg ${avgCharsPerPage} chars/page (text + many diagrams)`)
    console.log(`   → Will work but some pages may have sparse text.`)
  } else {
    console.log(`   ✅ Text-based — avg ${avgCharsPerPage} chars/page`)
  }

  if (stat.size <= MAX_ANTHROPIC_SIZE) {
    console.log(`   ✅ Compatible with Anthropic Files API (≤32MB) — Vision mode enabled`)
    console.log(`      Claude will see text AND diagrams natively`)
  } else {
    console.log(`   ⚠  Larger than 32MB — will use page rendering (not vision mode)`)
    console.log(`      Only text will be passed to Claude; diagrams rendered separately`)
  }

  if (lowTextPages > 0) {
    const pct = Math.round((lowTextPages / totalPages) * 100)
    console.log(`   🖼  ${lowTextPages} pages with low text (<50 chars) — ${pct}% likely diagrams`)
  }

  const samplePage = result.pages[Math.min(2, result.pages.length - 1)]
  const sampleText = samplePage?.text.slice(0, 200).replace(/\n+/g, ' ').trim()
  if (sampleText) {
    console.log(`\n   📝 Sample (page ~${samplePage.num}): "${sampleText}..."`)
  }

  const headingPattern = /^[A-Z][A-Z\s\-–]{4,}$/m
  const headings = fullText.split('\n')
    .filter((l: string) => headingPattern.test(l.trim()))
    .slice(0, 5)
  if (headings.length > 0) {
    console.log(`\n   📑 Detected headings: ${headings.map((h: string) => `"${h.trim()}"`).join(', ')}`)
  }

  const estimatedChunks = Math.ceil(totalChars / 1500)
  console.log(`\n   📊 Estimated: ~${estimatedChunks} text chunks after processing`)
  console.log(`\n   ✅ Ready to upload!\n`)
}

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: npm run analyze-pdf -- ./path/to/file.pdf [file2.pdf ...]')
  process.exit(1)
}

;(async () => {
  for (const filePath of args) {
    await analyzePDF(filePath)
  }
})()
