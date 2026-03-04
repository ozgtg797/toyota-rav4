export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'error'

export interface Document {
  id: string
  name: string
  display_name: string
  storage_path: string
  anthropic_file_id: string | null
  file_size: number
  page_count: number | null
  status: DocumentStatus
  error_message: string | null
  chunk_count: number
  created_at: string
  processed_at: string | null
}

export interface DocumentPage {
  id: string
  document_id: string
  page_number: number
  storage_path: string
  width: number | null
  height: number | null
}

export interface Chunk {
  id: string
  document_id: string
  chunk_index: number
  page_start: number | null
  page_end: number | null
  section_heading: string | null
  subsection: string | null
  content: string
  created_at: string
}

export interface ChunkWithDocument extends Chunk {
  documents: {
    display_name: string
    anthropic_file_id: string | null
  }
}

export interface Warning {
  type: 'danger' | 'warning' | 'caution' | 'note'
  message: string
}

export interface TorqueSpec {
  component: string
  metric: string
  imperial: string
}

export interface PageImageRef {
  document_id: string
  page_number: number
  storage_path: string
}

export interface TutorialStep {
  step_number: number
  title: string
  description: string
  details?: string
  warnings: Warning[]
  torque_specs: TorqueSpec[]
  tools_used: string[]
  page_images: PageImageRef[]
}

export interface TutorialPart {
  name: string
  quantity: string
  part_number?: string
}

export interface TutorialSource {
  document_name: string
  section: string
  pages: string
}

export interface Tutorial {
  id: string
  query: string
  query_normalized: string
  chunk_ids: string[]
  title: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null
  time_estimate: string | null
  overview: string | null
  tools: string[]
  parts: TutorialPart[]
  top_warnings: Warning[]
  steps: TutorialStep[]
  post_checks: string[]
  notes: string | null
  sources: TutorialSource[]
  generated_at: string
  view_count: number
}

export interface GenerateTutorialInput {
  query: string
  chunks: ChunkWithDocument[]
}
