-- ============================================================
-- Migration 004: Row Level Security (RLS) policies
-- ============================================================
-- Enforces user data isolation at the database level.
-- All user-owned tables have RLS enabled.
-- Service-role key bypasses RLS (server-side only).
-- ============================================================

-- ─────────────────────────────────────────────
-- Enable RLS on all user-owned tables
-- ─────────────────────────────────────────────

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_plans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sources  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contradictions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_reports  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_shares     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics     ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- profiles — users see and edit only their own
-- ─────────────────────────────────────────────

CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No DELETE policy — use Supabase Auth account deletion instead.

-- ─────────────────────────────────────────────
-- research_sessions — owner only
-- ─────────────────────────────────────────────

CREATE POLICY "sessions: select own"
  ON public.research_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sessions: insert own"
  ON public.research_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions: update own"
  ON public.research_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions: delete own"
  ON public.research_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- research_plans — via session ownership
-- ─────────────────────────────────────────────

CREATE POLICY "plans: select via session"
  ON public.research_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "plans: insert via session"
  ON public.research_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "plans: update via session"
  ON public.research_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- research_tasks — via session ownership
-- ─────────────────────────────────────────────

CREATE POLICY "tasks: select via session"
  ON public.research_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks: insert via session"
  ON public.research_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "tasks: update via session"
  ON public.research_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- research_sources — via session ownership
-- ─────────────────────────────────────────────

CREATE POLICY "sources: select via session"
  ON public.research_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "sources: insert via session"
  ON public.research_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- evidence — via session ownership
-- ─────────────────────────────────────────────

CREATE POLICY "evidence: select via session"
  ON public.evidence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "evidence: insert via session"
  ON public.evidence FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- claims — via session ownership
-- ─────────────────────────────────────────────

CREATE POLICY "claims: select via session"
  ON public.claims FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "claims: insert via session"
  ON public.claims FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- contradictions — via session ownership
-- ─────────────────────────────────────────────

CREATE POLICY "contradictions: select via session"
  ON public.contradictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "contradictions: insert via session"
  ON public.contradictions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- research_events — via session ownership (append-only for users)
-- ─────────────────────────────────────────────

CREATE POLICY "events: select via session"
  ON public.research_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.research_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

-- INSERT is server-only via service-role — no client INSERT policy needed.

-- ─────────────────────────────────────────────
-- research_reports — owner only (with public share exception below)
-- ─────────────────────────────────────────────

CREATE POLICY "reports: select own"
  ON public.research_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "reports: update own"
  ON public.research_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reports: delete own"
  ON public.research_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Public share read: allow SELECT if a valid public share token exists
-- This policy allows anonymous users to read a report via a share token.
-- The actual token lookup will be done via a Postgres function to avoid
-- exposing all report data.
CREATE POLICY "reports: select via public share"
  ON public.research_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.report_shares rs
      WHERE rs.report_id = id
        AND rs.is_public = TRUE
        AND (rs.expires_at IS NULL OR rs.expires_at > NOW())
    )
  );

-- ─────────────────────────────────────────────
-- citations — via report ownership
-- ─────────────────────────────────────────────

CREATE POLICY "citations: select via report"
  ON public.citations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.research_reports r
      WHERE r.id = report_id
        AND (
          r.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.report_shares rs
            WHERE rs.report_id = r.id
              AND rs.is_public = TRUE
              AND (rs.expires_at IS NULL OR rs.expires_at > NOW())
          )
        )
    )
  );

CREATE POLICY "citations: insert via report"
  ON public.citations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.research_reports r
      WHERE r.id = report_id AND r.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- report_shares — owner of the underlying report
-- ─────────────────────────────────────────────

CREATE POLICY "shares: select via report ownership"
  ON public.report_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.research_reports r
      WHERE r.id = report_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "shares: insert via report ownership"
  ON public.report_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.research_reports r
      WHERE r.id = report_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "shares: update via report ownership"
  ON public.report_shares FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.research_reports r
      WHERE r.id = report_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "shares: delete via report ownership"
  ON public.report_shares FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.research_reports r
      WHERE r.id = report_id AND r.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- usage_metrics — user sees only their own
-- ─────────────────────────────────────────────

CREATE POLICY "metrics: select own"
  ON public.usage_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT is server-only via service-role — no client INSERT policy needed.
