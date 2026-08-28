import { Request, Response } from "express";
import { supabaseAdmin } from "../db/supabase";
import { ResearchEngine } from "../engine";
import { CreateResearchRequest, ResearchDepth, ResearchStatus } from "@deepresearch/shared";

/**
 * Creates a new research session.
 * POST /api/v1/research
 */
export async function createResearchSession(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User not authenticated" } });
      return;
    }

    const payload: Partial<CreateResearchRequest> = req.body;

    if (!payload.question || typeof payload.question !== "string" || payload.question.trim().length === 0) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Question is required" } });
      return;
    }

    const depth = payload.depth || ResearchDepth.Standard;
    const metadata = payload.metadata || {
      preferredSourceTypes: [],
      prioritizeDomains: [],
      excludeDomains: [],
      maxIterations: 3,
      requirePlanApproval: false,
      requireFinalApproval: false,
    };

    // Auto-generate a short title from the question
    const title = payload.question.length > 50 ? payload.question.substring(0, 47) + "..." : payload.question;

    const { data: session, error } = await supabaseAdmin
      .from("research_sessions")
      .insert({
        user_id: user.id,
        question: payload.question.trim(),
        title,
        depth,
        status: ResearchStatus.Pending,
        metadata,
      })
      .select()
      .single();

    if (error || !session) {
      console.error("[ResearchController] Error creating session:", error);
      res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create research session" } });
      return;
    }

    // Trigger engine in background
    ResearchEngine.createPlan(session.id, metadata).catch((err) => {
      console.error("[ResearchController] Engine failed to start:", err);
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error("[ResearchController] Unexpected error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Unexpected error" } });
  }
}

/**
 * Gets a specific research session and its tasks/sources.
 * GET /api/v1/research/:id
 */
export async function getResearchSession(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User not authenticated" } });
      return;
    }

    // Since we use the service role key on the backend, we MUST enforce the user_id check manually here.
    const { data: session, error } = await supabaseAdmin
      .from("research_sessions")
      .select(`
        *,
        tasks:research_tasks(*),
        plan:research_plans(*)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !session) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Research session not found" } });
      return;
    }

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    console.error("[ResearchController] Unexpected error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Unexpected error" } });
  }
}

/**
 * Lists all research sessions for the user.
 * GET /api/v1/research
 */
export async function listResearchSessions(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User not authenticated" } });
      return;
    }

    const { data: sessions, error } = await supabaseAdmin
      .from("research_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ResearchController] Error listing sessions:", error);
      res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to list research sessions" } });
      return;
    }

    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    console.error("[ResearchController] Unexpected error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Unexpected error" } });
  }
}

/**
 * Deletes a research session.
 * DELETE /api/v1/research/:id
 */
export async function deleteResearchSession(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User not authenticated" } });
      return;
    }

    // Note: Due to ON DELETE CASCADE, this removes associated tasks, sources, evidence, etc.
    const { error, count } = await supabaseAdmin
      .from("research_sessions")
      .delete({ count: 'exact' })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[ResearchController] Error deleting session:", error);
      res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete research session" } });
      return;
    }

    if (count === 0) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Research session not found" } });
      return;
    }

    // Attempt to cancel engine if it was running
    ResearchEngine.cancelResearch(id).catch(console.error);

    res.status(200).json({ success: true, data: { deleted: true } });
  } catch (error) {
    console.error("[ResearchController] Unexpected error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Unexpected error" } });
  }
}

/**
 * Streams real-time events for a research session.
 * GET /api/v1/research/:id/events
 */
export async function streamResearchEvents(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User not authenticated" } });
      return;
    }

    // Verify ownership
    const { data: session, error: authError } = await supabaseAdmin
      .from("research_sessions")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (authError || !session) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Research session not found" } });
      return;
    }

    // Fetch historical events to backfill the client
    const { data: history } = await supabaseAdmin
      .from("research_events")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true });

    // Setup SSE connection via eventService
    const { eventService } = await import("../engine/events");
    eventService.subscribe(id, res);

    // Send historical events immediately
    if (history && history.length > 0) {
      for (const row of history) {
        const eventData = {
          type: row.event_type,
          sessionId: row.session_id,
          taskId: row.task_id,
          message: row.message,
          payload: row.payload,
          timestamp: row.created_at
        };
        res.write(`data: ${JSON.stringify(eventData)}\n\n`);
      }
    }
  } catch (error) {
    console.error("[ResearchController] Error in SSE stream:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Unexpected error" } });
    } else {
      res.end();
    }
  }
}

/**
 * Cancels a research session.
 * POST /api/v1/research/:id/cancel
 */
export async function cancelResearchSession(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User not authenticated" } });
      return;
    }

    // Verify ownership
    const { data: session, error: authError } = await supabaseAdmin
      .from("research_sessions")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (authError || !session) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Research session not found" } });
      return;
    }

    if (session.status === ResearchStatus.Complete || session.status === ResearchStatus.Failed || session.status === ResearchStatus.Cancelled) {
      res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Session cannot be cancelled in its current state" } });
      return;
    }

    await ResearchEngine.cancelResearch(id);

    res.status(200).json({ success: true, data: { cancelled: true } });
  } catch (error) {
    console.error("[ResearchController] Unexpected error cancelling:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_ERROR", message: "Unexpected error" } });
  }
}
