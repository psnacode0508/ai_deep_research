-- ============================================================
-- Migration 008: History indexes
-- ============================================================
-- Performance indexes for listing research history efficiently.

-- Index for getting the user's latest sessions (the default view)
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_created_at 
ON public.research_sessions (user_id, created_at DESC);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_status
ON public.research_sessions (user_id, status);

-- We don't add full text search indexing or pg_trgm yet to keep it simple,
-- but a standard index on user_id helps narrow down ILIKE searches.
-- The user_id index already exists implicitly via the user_id foreign key, 
-- but the composite indexes above will cover most querying needs.
