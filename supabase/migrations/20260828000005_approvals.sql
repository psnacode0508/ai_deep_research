-- ============================================================
-- Migration 005: Add explicit human-in-the-loop approval states
-- ============================================================

ALTER TABLE public.research_sessions DROP CONSTRAINT IF EXISTS research_sessions_status_check;

ALTER TABLE public.research_sessions ADD CONSTRAINT research_sessions_status_check CHECK (status IN (
  'pending', 
  'planning', 
  'awaiting_plan_approval', 
  'plan_rejected',
  'researching', 
  'evaluating',
  'reflecting', 
  'following_up', 
  'synthesising',
  'awaiting_final_approval', 
  'final_rejected',
  'complete', 
  'failed', 
  'cancelled'
));
