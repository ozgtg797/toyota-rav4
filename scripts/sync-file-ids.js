require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const Anthropic = require('@anthropic-ai/sdk').default
const { createClient } = require('@supabase/supabase-js')
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function clean() {
  const files = await anthropic.beta.files.list()
  const validIds = new Set(files.data.map(f => f.id))
  const validNames = new Set(files.data.map(f => f.filename))
  console.log('Valid files on Anthropic:', validNames.size)

  const { data: docsWithFileId } = await sb.from('documents').select('id, name, anthropic_file_id').not('anthropic_file_id', 'is', null)
  let cleared = 0
  for (const doc of docsWithFileId || []) {
    if (!validNames.has(doc.name) || !validIds.has(doc.anthropic_file_id)) {
      await sb.from('documents').update({ anthropic_file_id: null }).eq('id', doc.id)
      console.log('Cleared expired file_id:', doc.name)
      cleared++
    }
  }
  console.log('Done. Cleared:', cleared, '| Valid kept:', (docsWithFileId?.length || 0) - cleared)
}

clean().catch(console.error)
