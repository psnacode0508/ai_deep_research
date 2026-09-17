/**
 * @deepresearch/shared
 *
 * Shared TypeScript types used across the frontend (apps/web)
 * and backend (apps/server). Keep this package pure TypeScript —
 * no runtime dependencies, no side effects.
 *
 * These types will evolve as milestones are implemented.
 */

// ─────────────────────────────────────────────
// Enumerations
// ─────────────────────────────────────────────

/**
 * Lifecycle states of a research session.
 */
export enum ResearchStatus {
  /** Session created but not yet started */
  Pending = "pending",
  /** Research planner is breaking down the question */
  Planning = "planning",
  /** Parallel web research tasks are executing */
  Researching = "researching",
  /** Evidence is being evaluated and cross-checked */
  Evaluating = "evaluating",
  /** Agent is reflecting on coverage and gaps */
  Reflecting = "reflecting",
  /** Follow-up research triggered by reflection */
  FollowingUp = "following_up",
  /** Final report is being synthesised */
  Synthesising = "synthesising",
  /** Awaiting human plan review / approval */
  AwaitingPlanApproval = "awaiting_plan_approval",
  /** Plan rejected */
  PlanRejected = "plan_rejected",
  /** Awaiting human final report review / approval */
  AwaitingFinalApproval = "awaiting_final_approval",
  /** Final report rejected */
  FinalRejected = "final_rejected",
  /** Research completed successfully */
  Complete = "complete",
  /** Research failed with an unrecoverable error */
  Failed = "failed",
  /** Cancelled by the user */
  Cancelled = "cancelled",
}

/**
 * Controls how deep / thorough the research will be.
 * Influences number of tasks, sources, and reflection iterations.
 */
export enum ResearchDepth {
  /** Fast, surface-level scan (fewer tasks, fewer sources) */
  Quick = "quick",
  /** Balanced depth — the default */
  Standard = "standard",
  /** Exhaustive research with multiple reflection rounds */
  Deep = "deep",
}

// ─────────────────────────────────────────────
// Core domain interfaces
// ─────────────────────────────────────────────

/**
 * A single web source retrieved during research.
 */
export interface ResearchSource {
  /** Unique identifier */
  id: string;
  /** Full URL of the source */
  url: string;
  /** Page title (if available) */
  title: string | null;
  /** Short excerpt or summary of relevant content */
  excerpt: string | null;
  /** Domain extracted from the URL (e.g. "reuters.com") */
  domain: string | null;
  /**
   * Credibility / relevance score assigned by the research engine.
   * Range: 0.0 – 1.0
   */
  relevanceScore: number | null;
  /** ISO 8601 timestamp when the source was retrieved */
  retrievedAt: string;
}

/**
 * A discrete unit of research work assigned to the research engine.
 * A session is broken into multiple tasks that can run in parallel.
 */
export interface ResearchTask {
  /** Unique identifier */
  id: string;
  /** Parent session this task belongs to */
  sessionId: string;
  /** The specific sub-question or search query for this task */
  query: string;
  /** Current status of this individual task */
  status: ResearchStatus;
  /** Sources collected during this task */
  sources: ResearchSource[];
  /** Raw evidence extracted from sources */
  evidence: string | null;
  /** Contradictions detected within this task's evidence */
  contradictions: string[] | null;
  /** ISO 8601 timestamp when the task started */
  startedAt: string | null;
  /** ISO 8601 timestamp when the task completed */
  completedAt: string | null;
}

/**
 * Configuration metadata for a research session.
 */
export interface ResearchSessionMetadata {
  preferredSourceTypes: string[];
  prioritizeDomains: string[];
  excludeDomains: string[];
  maxIterations: number;
  requirePlanApproval: boolean;
  requireFinalApproval: boolean;
}

/**
 * A full research session initiated by a user question.
 */
export interface ResearchSession {
  /** Unique identifier (UUID) */
  id: string;
  /** ID of the user who owns this session */
  userId: string;
  /** Short auto-generated label */
  title: string | null;
  /** The original research question as entered by the user */
  question: string;
  /** Configured depth for this session */
  depth: ResearchDepth;
  /** Overall lifecycle status */
  status: ResearchStatus;
  /** Decomposed research tasks produced by the planner */
  tasks: ResearchTask[];
  /** Final synthesised report (Markdown, citation-backed) */
  report: string | null;
  /** Structured citations for the report */
  citations: ResearchSource[];
  /** Session configuration */
  metadata: ResearchSessionMetadata;
  /** ISO 8601 timestamp of session creation */
  createdAt: string;
  /** ISO 8601 timestamp of last update */
  updatedAt: string;
}

/**
 * Payload for POST /api/v1/research
 */
export interface CreateResearchRequest {
  question: string;
  depth: ResearchDepth;
  metadata: ResearchSessionMetadata;
}

// ─────────────────────────────────────────────
// Real-time event types (used with SSE later)
// ─────────────────────────────────────────────

/**
 * Categories of events emitted by the research engine.
 * These will be streamed to the frontend via Server-Sent Events.
 */
export type ResearchEventType =
  | "session.created"
  | "session.status_changed"
  | "planning.started"
  | "planning.completed"
  | "task.created"
  | "task.started"
  | "task.source_found"
  | "task.evidence_extracted"
  | "task.completed"
  | "task.failed"
  | "evaluation.started"
  | "evaluation.contradiction_detected"
  | "evaluation.completed"
  | "reflection.started"
  | "reflection.gap_identified"
  | "reflection.completed"
  | "synthesis.started"
  | "synthesis.completed"
  | "session.completed"
  | "session.failed";

/**
 * A single event emitted during a research session.
 * The frontend subscribes to these via SSE to render live progress.
 */
export interface ResearchEvent {
  /** Event type discriminator */
  type: ResearchEventType;
  /** ID of the session this event belongs to */
  sessionId: string;
  /** Optional: ID of the task this event relates to */
  taskId?: string;
  /** Human-readable progress message */
  message: string;
  /** Arbitrary structured payload (type-narrowed by consumers) */
  payload?: unknown;
  /** ISO 8601 timestamp */
  timestamp: string;
}

// ─────────────────────────────────────────────
// Authentication types
// ─────────────────────────────────────────────

/**
 * Safe authenticated user info returned by GET /api/v1/auth/me.
 * Only fields safe to expose are included — never raw tokens.
 */
export interface AuthUser {
  /** Supabase user UUID */
  id: string;
  /** User email address */
  email: string;
  /** Whether the email has been verified */
  emailVerified: boolean;
  /** ISO 8601 timestamp of account creation */
  createdAt: string;
}

/**
 * Standard API response envelope used by the backend.
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
