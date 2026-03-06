/**
 * Batch PDF Upload & Process Script
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/batch-upload.ts /path/to/folder
 *
 * Example:
 *   npx ts-node --project tsconfig.scripts.json scripts/batch-upload.ts ~/Desktop/Repair_Manual_V4_1996-1999
 *
 * - Skips already uploaded files (safe to re-run if interrupted)
 * - Processes one by one, shows progress
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'

// Patch @/ alias before importing project files
require('module').Module._resolveFilename = (function(original: Function) {
  return function(request: string, ...args: unknown[]) {
    if (request.startsWith('@/')) {
      request = require('path').resolve(__dirname, '..', request.slice(2))
    }
    return original.call(this, request, ...args)
  }
})(require('module').Module._resolveFilename)

import { processPDF } from '../lib/pdf/pipeline'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function cleanDisplayName(filename: string): string {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/[_-]/g, ' ')
    .trim()
}

async function isAlreadyUploaded(filename: string): Promise<string | null> {
  const { data } = await supabase
    .from('documents')
    .select('id, status')
    .eq('name', filename)
    .single()

  if (data && data.status === 'ready') {
    return data.id // already processed successfully
  }
  return null
}

async function uploadAndProcess(filePath: string, folderLabel: string): Promise<void> {
  const filename = path.basename(filePath)
  const displayName = `[${folderLabel}] ${cleanDisplayName(filename)}`
  const stat = fs.statSync(filePath)

  // Skip non-PDFs
  if (!filename.toLowerCase().endsWith('.pdf')) return

  // Check if already done
  const existingId = await isAlreadyUploaded(filename)
  if (existingId) {
    console.log(`  ⏭  Skipping (already done): ${filename}`)
    return
  }

  console.log(`  ⬆️  Uploading: ${filename} (${(stat.size / 1024).toFixed(0)} KB)`)

  const buffer = fs.readFileSync(filePath)
  const storagePath = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    console.log(`  ❌ Upload failed: ${uploadError.message}`)
    return
  }

  // Create document record
  const { data: doc, error: dbError } = await supabase
    .from('documents')
    .insert({
      name: filename,
      display_name: displayName,
      storage_path: storagePath,
      file_size: stat.size,
      status: 'pending',
    })
    .select()
    .single()

  if (dbError || !doc) {
    console.log(`  ❌ DB insert failed: ${dbError?.message}`)
    return
  }

  // Process PDF
  console.log(`  ⚙️  Processing: ${filename}...`)
  try {
    const result = await processPDF(doc.id)
    console.log(`  ✅ Done: ${filename} — ${result.chunkCount} chunks, ${result.pagesRendered} pages`)
  } catch (err) {
    console.log(`  ❌ Processing failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}

async function processFolder(folderPath: string): Promise<void> {
  const absPath = path.resolve(folderPath)

  if (!fs.existsSync(absPath)) {
    console.error(`❌ Folder not found: ${absPath}`)
    return
  }

  const folderLabel = path.basename(absPath)
  const files = fs.readdirSync(absPath)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .sort()

  if (files.length === 0) {
    console.log(`⚠️  No PDFs found in: ${absPath}`)
    return
  }

  console.log(`\n📁 ${folderLabel} — ${files.length} PDFs`)
  console.log('─'.repeat(60))

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    console.log(`\n[${i + 1}/${files.length}] ${file}`)
    await uploadAndProcess(path.join(absPath, file), folderLabel)
  }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: npx ts-node --project tsconfig.scripts.json scripts/batch-upload.ts /path/to/folder [folder2] [folder3]')
    process.exit(1)
  }

  console.log('🚗 Toyota RAV4 — Batch PDF Processor')
  console.log('=====================================')
  console.log(`📡 Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log(`📂 Folders: ${args.length}`)

  for (const folder of args) {
    await processFolder(folder)
  }

  console.log('\n\n✅ All done!')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
