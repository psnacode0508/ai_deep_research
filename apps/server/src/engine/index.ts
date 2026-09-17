import { app as graphApp } from "./graph";
import { supabaseAdmin } from "../db/supabase";
import { ResearchStatus } from "@deepresearch/shared";

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  RESEARCH ENGINE BOUNDARY                                    ║
 * ║                                                              ║
 * ║  This module is the single integration point between the     ║
 * ║  HTTP/API layer (Express routes/controllers) and the         ║
 * ║  multi-agent research engine (LangGraph).                    ║
 * ║                                                              ║
 * ║  DO NOT add HTTP concerns (req/res) to this module.          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

export class ResearchEngine {
  /**
   * Loads a session from the database.
   */
  private static async getSession(sessionId: string) {
    const { data: session, error } = await supabaseAdmin
      .from("research_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
      
    if (error || !session) throw new Error("Session not found");
    return session;
  }

  /**
   * Generates a research plan and starts execution (M5 async execution).
   */
  static async createPlan(sessionId: string, config: any): Promise<void> {
    console.log(`[Engine] createPlan called for session: ${sessionId}`);
    // In M5, we just start the whole graph directly instead of pausing at plan for now
    // unless requirePlanApproval is true (handled in graph edges).
    this.startResearch(sessionId).catch(e => {
      console.error(`[Engine] Background execution failed: ${e.message}`);
    });
  }

  /**
   * Starts executing the tasks in a research plan.
   */
  static async startResearch(sessionId: string): Promise<void> {
    console.log(`[Engine] startResearch called for session: ${sessionId}`);
    
    try {
      const session = await this.getSession(sessionId);
      
      await graphApp.invoke({
        sessionId,
        question: session.question,
        depth: session.depth,
        metadata: session.metadata || {},
        currentStatus: session.status,
      });
      
      console.log(`[Engine] Execution completed for session: ${sessionId}`);
    } catch (error: any) {
      console.error(`[Engine] Critical error running graph for ${sessionId}:`, error);
      await supabaseAdmin
        .from("research_sessions")
        .update({ 
          status: ResearchStatus.Failed,
          error_message: error.message 
        })
        .eq("id", sessionId);
    }
  }

  /**
   * Resumes a paused research session.
   */
  static async resumeResearch(sessionId: string): Promise<void> {
    console.log(`[Engine] resumeResearch called for session: ${sessionId}`);
    // Milestone 5: We don't have persistence checkpointing wired for resume yet.
    // This will be implemented in a future milestone.
  }

  /**
   * Cancels an ongoing research session.
   */
  static async cancelResearch(sessionId: string): Promise<void> {
    console.log(`[Engine] cancelResearch called for session: ${sessionId}`);
    await supabaseAdmin
      .from("research_sessions")
      .update({ status: ResearchStatus.Cancelled })
      .eq("id", sessionId);
  }
}
