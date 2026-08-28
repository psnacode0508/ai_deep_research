-- ============================================================
-- Migration 003: Reporting tables
-- ============================================================
-- Depends on: research_sessions, research_sources, claims,
--             research_plans (migration 002)
-- Tables: research_reports, citations, report_shares,
--         usage_metrics
-- ============================================================

-- ─────────────────────────────────────────────
-- research_reports
-- ─────────────────────────────────────────────
-- The final synthesised Markdown report for a session.
-- One session produces at most one approved report.

CREATE TABLE IF NOT EXISTS public.research_reports (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID        NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  content      TEXT        NOT NULL,                        -- full Markdown report body
  summary      TEXT,                                        -- 1–3 sentence abstract
  is_approved  BOOLEAN     NOT NULL DEFAULT FALSE,          -- human-approved flag
  approved_at  TIMESTAMPTZ,
  word_count   INTEGER     CHECK (word_count >= 0),
  source_count INTEGER     CHECK (source_count >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id)                                       -- one report per session
);

COMMENT ON TABLE public.research_reports IS 'Synthesised Markdown report produced at the end of a research session.';

CREATE TRIGGER research_reports_updated_at
  BEFORE UPDATE ON public.research_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────
-- citations
-- ─────────────────────────────────────────────
-- Links report content to specific sources, numbered sequentially.
-- Provides evidence provenance: Claim → Citation → Source → URL.

CREATE TABLE IF NOT EXISTS public.citations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id       UUID        NOT NULL REFERENCES public.research_reports(id) ON DELETE CASCADE,
  source_id       UUID        NOT NULL REFERENCES public.research_sources(id) ON DELETE CASCADE,
  claim_id        UUID        REFERENCES public.claims(id) ON DELETE SET NULL,
  citation_number INTEGER     NOT NULL CHECK (citation_number > 0),
  context         TEXT,                                     -- surrounding text snippet in report
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (report_id, citation_number),                      -- citation numbers unique within a report
  UNIQUE (report_id, source_id)                             -- each source cited once per report
);

COMMENT ON TABLE public.citations IS 'Numbered citations linking report content to source URLs. Provenance chain: Claim → Citation → Source → URL.';

-- ─────────────────────────────────────────────
-- report_shares
-- ─────────────────────────────────────────────
-- Controls public/private sharing of reports via token.

CREATE TABLE IF NOT EXISTS public.report_shares (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id    UUID        NOT NULL REFERENCES public.research_reports(id) ON DELETE CASCADE,
  share_token  TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
  is_public    BOOLEAN     NOT NULL DEFAULT FALSE,
  expires_at   TIMESTAMPTZ,                                 -- NULL = never expires
  view_count   INTEGER     NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.report_shares IS 'Shareable tokens for reports. Supports public/private and expiry.';

-- ─────────────────────────────────────────────
-- usage_metrics
-- ─────────────────────────────────────────────
-- Tracks API and compute usage per user per session.
-- Used for cost monitoring and future rate-limiting.

CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id   UUID        REFERENCES public.research_sessions(id) ON DELETE SET NULL,
  metric_type  TEXT        NOT NULL,                        -- 'llm_input_tokens' | 'llm_output_tokens' | 'web_searches' | 'sources_fetched'
  value        NUMERIC     NOT NULL DEFAULT 0 CHECK (value >= 0),
  metadata     JSONB,                                       -- model name, task_id, etc.
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.usage_metrics IS 'Per-user API usage tracking for cost monitoring and rate-limiting.';
