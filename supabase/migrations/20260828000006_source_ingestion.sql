-- ============================================================
-- Migration 006: Source Ingestion & Evidence Quality
-- ============================================================

-- Add source categorization and metadata to research_sources
ALTER TABLE public.research_sources
ADD COLUMN IF NOT EXISTS source_category TEXT,
ADD COLUMN IF NOT EXISTS reliability_rationale TEXT,
ADD COLUMN IF NOT EXISTS is_primary_source BOOLEAN,
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'web_search';

-- Ensure we can attach sources to a session directly (task_id can be NULL for user sources before planner runs)
ALTER TABLE public.research_sources
ALTER COLUMN task_id DROP NOT NULL;

-- Add location_info to evidence (for PDF pages, section headers, etc.)
ALTER TABLE public.evidence
ADD COLUMN IF NOT EXISTS location_info TEXT;
