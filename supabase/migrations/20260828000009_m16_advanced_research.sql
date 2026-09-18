-- Migration 009: M16 Advanced Research
-- Adds metadata columns for extended source quality and corroboration features

ALTER TABLE public.research_sources
ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE public.evidence
ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE public.claims
ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE public.research_tasks
ADD COLUMN IF NOT EXISTS role TEXT;
