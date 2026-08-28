-- ============================================================
-- Migration 002: Research pipeline tables
-- ============================================================
-- Depends on: public.profiles (migration 001)
-- Tables: research_sessions, research_plans, research_tasks,
--         research_sources, evidence, claims, contradictions,
--         research_events
-- ============================================================

-- ─────────────────────────────────────────────
-- research_sessions
-- ─────────────────────────────────────────────
-- Root table representing one research job initiated by a user.
-- All other research pipeline tables cascade from this.

CREATE TABLE IF NOT EXISTS public.research_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT,                                         -- short auto-generated label
  question    TEXT        NOT NULL,                         -- original user question
  depth       TEXT        NOT NULL DEFAULT 'standard'
                CHECK (depth IN ('quick', 'standard', 'deep')),
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN (
                  'pending', 'planning', 'researching', 'evaluating',
                  'reflecting', 'following_up', 'synthesising',
                  'awaiting_approval', 'complete', 'failed', 'cancelled'
                )),
  error_message TEXT,                                       -- populated on status='failed'
  metadata    JSONB,                                        -- flexible engine metadata
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.research_sessions IS 'Top-level research job. All pipeline data belongs to a session.';

CREATE TRIGGER research_sessions_updated_at
  BEFORE UPDATE ON public.research_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────
-- research_plans
-- ─────────────────────────────────────────────
-- Stores the planner output (task decomposition) for a session.
-- One session → one plan (1:1).

CREATE TABLE IF NOT EXISTS public.research_plans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  task_count  INTEGER     NOT NULL DEFAULT 0,
  raw_plan    JSONB,                                        -- full LangGraph planner JSON output
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id)                                       -- one plan per session
);

COMMENT ON TABLE public.research_plans IS 'Planner output decomposing a session into research tasks.';

-- ─────────────────────────────────────────────
-- research_tasks
-- ─────────────────────────────────────────────
-- Individual sub-questions executed in parallel by the research engine.

CREATE TABLE IF NOT EXISTS public.research_tasks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID        NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  plan_id      UUID        REFERENCES public.research_plans(id) ON DELETE SET NULL,
  query        TEXT        NOT NULL,
  task_index   INTEGER     NOT NULL DEFAULT 0,              -- order within the plan
  is_followup  BOOLEAN     NOT NULL DEFAULT FALSE,          -- true if triggered by reflection gap
  status       TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN (
                   'pending', 'researching', 'complete', 'failed'
                 )),
  error_message TEXT,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.research_tasks IS 'Individual search/research sub-tasks belonging to a session.';

-- ─────────────────────────────────────────────
-- research_sources
-- ─────────────────────────────────────────────
-- Web pages retrieved by the research engine during a task.

CREATE TABLE IF NOT EXISTS public.research_sources (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID        NOT NULL REFERENCES public.research_tasks(id) ON DELETE CASCADE,
  session_id      UUID        NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  url             TEXT        NOT NULL,
  title           TEXT,
  domain          TEXT,                                     -- extracted hostname
  excerpt         TEXT,                                     -- relevant snippet
  full_content    TEXT,                                     -- full fetched page text (may be large)
  relevance_score NUMERIC(4,3) CHECK (relevance_score BETWEEN 0 AND 1),
  is_credible     BOOLEAN,                                  -- engine-assigned credibility flag
  retrieved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.research_sources IS 'Web sources retrieved per task. Relevance and credibility scored by the engine.';

-- ─────────────────────────────────────────────
-- evidence
-- ─────────────────────────────────────────────
-- Specific passages extracted from sources as supporting evidence.

CREATE TABLE IF NOT EXISTS public.evidence (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id       UUID        NOT NULL REFERENCES public.research_sources(id) ON DELETE CASCADE,
  task_id         UUID        NOT NULL REFERENCES public.research_tasks(id) ON DELETE CASCADE,
  session_id      UUID        NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  content         TEXT        NOT NULL,                     -- extracted text passage
  relevance_score NUMERIC(4,3) CHECK (relevance_score BETWEEN 0 AND 1),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.evidence IS 'Text passages extracted from sources as supporting evidence for claims.';

-- ─────────────────────────────────────────────
-- claims
-- ─────────────────────────────────────────────
-- Factual assertions distilled from evidence by the research engine.

CREATE TABLE IF NOT EXISTS public.claims (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  evidence_id UUID        REFERENCES public.evidence(id) ON DELETE SET NULL,
  source_id   UUID        REFERENCES public.research_sources(id) ON DELETE SET NULL,
  content     TEXT        NOT NULL,                         -- the claim statement
  confidence  NUMERIC(4,3) CHECK (confidence BETWEEN 0 AND 1),
  is_verified BOOLEAN,                                      -- NULL=unverified, TRUE=confirmed, FALSE=refuted
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.claims IS 'Factual assertions distilled from evidence. Verified or refuted during evaluation.';

-- ─────────────────────────────────────────────
-- contradictions
-- ─────────────────────────────────────────────
-- Pairs of claims that directly contradict each other.

CREATE TABLE IF NOT EXISTS public.contradictions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  claim_a_id  UUID        NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  claim_b_id  UUID        NOT NULL REFERENCES public.claims(id) ON DELETE CASCADE,
  description TEXT        NOT NULL,                         -- explanation of the contradiction
  severity    TEXT        NOT NULL DEFAULT 'minor'
                CHECK (severity IN ('minor', 'major', 'critical')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (claim_a_id <> claim_b_id)                          -- a claim cannot contradict itself
);

COMMENT ON TABLE public.contradictions IS 'Detected contradictions between claim pairs during evaluation.';

-- ─────────────────────────────────────────────
-- research_events
-- ─────────────────────────────────────────────
-- Append-only event log matching ResearchEventType.
-- Used as source of truth for SSE streaming in a future milestone.

CREATE TABLE IF NOT EXISTS public.research_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  task_id     UUID        REFERENCES public.research_tasks(id) ON DELETE SET NULL,
  event_type  TEXT        NOT NULL,                         -- ResearchEventType string
  message     TEXT        NOT NULL,
  payload     JSONB,                                        -- structured event data
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.research_events IS
  'Append-only event log. Powers SSE progress streaming. Never updated — only inserted.';
