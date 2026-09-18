-- ============================================================
-- Migration 007: Research Evaluations
-- ============================================================

CREATE TABLE IF NOT EXISTS public.research_evaluations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID        NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quality_metrics     JSONB       NOT NULL DEFAULT '{}'::jsonb,
  source_metrics      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  performance_metrics JSONB       NOT NULL DEFAULT '{}'::jsonb,
  usage_metrics       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id)
);

COMMENT ON TABLE public.research_evaluations IS 'Stores deterministic quality and performance metrics for a research session.';

ALTER TABLE public.research_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own research evaluations"
  ON public.research_evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert research evaluations"
  ON public.research_evaluations FOR INSERT
  WITH CHECK (true);
