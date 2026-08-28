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
