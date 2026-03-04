-- Toyota RAV4 1997 Auto Maintenance Tutorial DB Schema

-- Documents (one per uploaded PDF)
CREATE TABLE IF NOT EXISTS documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  anthropic_file_id TEXT,
  file_size     BIGINT NOT NULL,
  page_count    INT,
  status        TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  chunk_count   INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  processed_at  TIMESTAMPTZ
);

-- Page images (rendered from PDF pages)
CREATE TABLE IF NOT EXISTS document_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  page_number   INT NOT NULL,
  storage_path  TEXT NOT NULL,
  width         INT,
  height        INT,
  UNIQUE(document_id, page_number)
);

-- Text chunks (for search)
CREATE TABLE IF NOT EXISTS chunks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index     INT NOT NULL,
  page_start      INT,
  page_end        INT,
  section_heading TEXT,
  subsection      TEXT,
  content         TEXT NOT NULL,
  search_vector   TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(section_heading,'') || ' ' || coalesce(subsection,'') || ' ' || content
    )
  ) STORED,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chunks_search_idx ON chunks USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS chunks_document_idx ON chunks(document_id);

-- Cached generated tutorials
CREATE TABLE IF NOT EXISTS tutorials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query           TEXT NOT NULL,
  query_normalized TEXT NOT NULL,
  chunk_ids       UUID[] NOT NULL,
  title           TEXT NOT NULL,
  difficulty      TEXT,
  time_estimate   TEXT,
  overview        TEXT,
  tools           JSONB NOT NULL DEFAULT '[]',
  parts           JSONB NOT NULL DEFAULT '[]',
  top_warnings    JSONB NOT NULL DEFAULT '[]',
  steps           JSONB NOT NULL DEFAULT '[]',
  post_checks     JSONB NOT NULL DEFAULT '[]',
  notes           TEXT,
  sources         JSONB NOT NULL DEFAULT '[]',
  generated_at    TIMESTAMPTZ DEFAULT NOW(),
  view_count      INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS tutorials_query_idx ON tutorials(query_normalized);

-- Storage buckets (run these in Supabase dashboard or via CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pages', 'pages', true);
