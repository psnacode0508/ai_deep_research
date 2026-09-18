import { supabaseAdmin } from "../db/supabase";
import { QualityMetrics, SourceQualityMetrics, PerformanceMetrics, UsageMetricsData, ResearchEvaluation } from "@deepresearch/shared";
import { recordEvent } from "./db";
import { config } from "../config/env";

export async function evaluateResearchSession(sessionId: string, userId: string): Promise<ResearchEvaluation> {
  try {
    await recordEvent(sessionId, "evaluation.started", "Starting deterministic research evaluation");

    // Fetch all related data
    const [
      { data: sources },
      { data: evidence },
      { data: claims },
      { data: citations },
      { data: tasks },
      { data: events },
      { data: usage },
      { data: contradictions }
    ] = await Promise.all([
      supabaseAdmin.from("research_sources").select("*").eq("session_id", sessionId),
      supabaseAdmin.from("evidence").select("*").eq("session_id", sessionId),
      supabaseAdmin.from("claims").select("*").eq("session_id", sessionId),
      supabaseAdmin.from("citations").select("*, report:research_reports!inner(session_id)").eq("report.session_id", sessionId),
      supabaseAdmin.from("research_tasks").select("*").eq("session_id", sessionId),
      supabaseAdmin.from("research_events").select("*").eq("session_id", sessionId).order("created_at", { ascending: true }),
      supabaseAdmin.from("usage_metrics").select("*").eq("session_id", sessionId),
      supabaseAdmin.from("contradictions").select("*").eq("session_id", sessionId)
    ]);

    const safeSources = sources || [];
    const safeEvidence = evidence || [];
    const safeClaims = claims || [];
    const safeCitations = citations || [];
    const safeTasks = tasks || [];
    const safeEvents = events || [];
    const safeUsage = usage || [];
    const safeContradictions = contradictions || [];

    // --- 1. Quality Metrics ---
    const sourcesWithEvidence = new Set(safeEvidence.map(e => e.source_id)).size;
    const evidenceCoverage = safeSources.length > 0 ? sourcesWithEvidence / safeSources.length : 0;
    
    const claimsWithEvidence = safeClaims.filter(c => c.evidence_id != null).length;
    const claimToEvidenceLinkage = safeClaims.length > 0 ? claimsWithEvidence / safeClaims.length : 0;
    
    const citationsWithSource = safeCitations.filter(c => c.source_id != null).length;
    const citationCompleteness = safeCitations.length > 0 ? citationsWithSource / safeCitations.length : 0;
    const citationValidity = citationCompleteness; // Deterministic validity is having a bound source

    const followUpTasks = safeTasks.filter(t => t.is_followup);
    
    // M16: Corroboration metrics
    const claimsWithCorroboration = safeClaims.filter(c => c.metadata && c.metadata.corroborating_ids && c.metadata.corroborating_ids.length > 0).length;
    const claimsWithSingleSource = safeClaims.length - claimsWithCorroboration;
    const corroborationRate = safeClaims.length > 0 ? claimsWithCorroboration / safeClaims.length : 0;
    const singleSourceRate = safeClaims.length > 0 ? claimsWithSingleSource / safeClaims.length : 0;

    const qualityMetrics: QualityMetrics = {
      evidenceCoverage,
      claimToEvidenceLinkage,
      citationCompleteness,
      citationValidity,
      numberOfClaims: safeClaims.length,
      numberOfEvidenceItems: safeEvidence.length,
      numberOfSources: safeSources.length,
      contradictionCount: safeContradictions.length,
      unresolvedContradictionCount: safeContradictions.filter(c => !c.resolved).length, // assuming resolved column exists or just use 0 if not
      identifiedResearchGaps: followUpTasks.length,
      followUpIterationCount: followUpTasks.length > 0 ? 1 : 0, // simplify: 1 if any followups happened
      corroborationRate,
      singleSourceRate
    };

    // --- 2. Source Quality Metrics ---
    const domains = new Set(safeSources.map(s => s.domain).filter(Boolean));
    const categoryDistribution: Record<string, number> = {};
    for (const s of safeSources) {
      const cat = s.source_category || "unknown";
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    }

    const sourceMetrics: SourceQualityMetrics = {
      sourceDiversity: domains.size,
      categoryDistribution
    };

    // --- 3. Performance Metrics ---
    const getEventTime = (type: string) => safeEvents.find(e => e.event_type === type)?.created_at;
    const planningStart = getEventTime("planning.started");
    const planningEnd = getEventTime("planning.completed");
    const synthesisStart = getEventTime("synthesis.started");
    const synthesisEnd = getEventTime("synthesis.completed");
    const sessionCreated = safeEvents[0]?.created_at || new Date().toISOString();
    
    const calcDuration = (start?: string, end?: string) => 
      (start && end) ? new Date(end).getTime() - new Date(start).getTime() : 0;

    const planningDurationMs = calcDuration(planningStart, planningEnd);
    const synthesisDurationMs = calcDuration(synthesisStart, synthesisEnd);
    const totalDurationMs = new Date().getTime() - new Date(sessionCreated).getTime();

    // Estimate search and extraction from tasks
    let searchDurationMs = 0;
    for (const t of safeTasks) {
      searchDurationMs += calcDuration(t.started_at, t.completed_at);
    }

    const performanceMetrics: PerformanceMetrics = {
      totalDurationMs,
      planningDurationMs,
      searchDurationMs,
      extractionDurationMs: 0, // Hard to separate from search accurately with current events
      synthesisDurationMs,
      numberOfSearches: safeTasks.length,
      numberOfFollowUpSearches: followUpTasks.length,
      workerRetries: safeEvents.filter(e => e.event_type === "task.failed" && e.payload?.retry).length,
      failedTasks: safeTasks.filter(t => t.status === "failed").length
    };

    // --- 4. Usage Metrics ---
    const usageMetrics: UsageMetricsData = {
      geminiRequestCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      tavilySearches: 0,
      estimatedGeminiCost: 0,
      estimatedTavilyCost: 0,
      totalEstimatedCost: 0
    };

    for (const u of safeUsage) {
      if (u.metric_type === "llm_input_tokens") usageMetrics.inputTokens = (usageMetrics.inputTokens || 0) + Number(u.value);
      if (u.metric_type === "llm_output_tokens") usageMetrics.outputTokens = (usageMetrics.outputTokens || 0) + Number(u.value);
      if (u.metric_type === "web_searches") usageMetrics.tavilySearches = (usageMetrics.tavilySearches || 0) + Number(u.value);
      if (u.metric_type === "llm_requests") usageMetrics.geminiRequestCount = (usageMetrics.geminiRequestCount || 0) + Number(u.value);
    }
    
    // Very rough estimate config (configurable in reality)
    const COST_PER_1M_INPUT = config.gemini?.inputCostPerMillion || null;
    const COST_PER_1M_OUTPUT = config.gemini?.outputCostPerMillion || null;
    const COST_PER_1000_SEARCHES = config.tavily?.costPerThousand || null;

    if (COST_PER_1M_INPUT !== null && usageMetrics.inputTokens) {
      usageMetrics.estimatedGeminiCost = (usageMetrics.inputTokens / 1000000) * COST_PER_1M_INPUT;
    }
    if (COST_PER_1M_OUTPUT !== null && usageMetrics.outputTokens) {
      usageMetrics.estimatedGeminiCost = (usageMetrics.estimatedGeminiCost || 0) + (usageMetrics.outputTokens / 1000000) * COST_PER_1M_OUTPUT;
    }
    if (COST_PER_1000_SEARCHES !== null && usageMetrics.tavilySearches) {
      usageMetrics.estimatedTavilyCost = (usageMetrics.tavilySearches / 1000) * COST_PER_1000_SEARCHES;
    }
    
    if (usageMetrics.estimatedGeminiCost !== undefined || usageMetrics.estimatedTavilyCost !== undefined) {
      usageMetrics.totalEstimatedCost = (usageMetrics.estimatedGeminiCost || 0) + (usageMetrics.estimatedTavilyCost || 0);
    } else {
      usageMetrics.totalEstimatedCost = 0;
    }

    // --- 5. Persist Evaluation ---
    const { data: evaluation, error: insertError } = await supabaseAdmin
      .from("research_evaluations")
      .upsert({
        session_id: sessionId,
        user_id: userId,
        quality_metrics: qualityMetrics,
        source_metrics: sourceMetrics,
        performance_metrics: performanceMetrics,
        usage_metrics: usageMetrics,
        created_at: new Date().toISOString()
      }, { onConflict: "session_id" })
      .select()
      .single();

    if (insertError) throw new Error(`Failed to save evaluation: ${insertError.message}`);

    await recordEvent(sessionId, "evaluation.completed", "Evaluation completed successfully");

    return {
      id: evaluation.id,
      sessionId: evaluation.session_id,
      qualityMetrics: evaluation.quality_metrics,
      sourceMetrics: evaluation.source_metrics,
      performanceMetrics: evaluation.performance_metrics,
      usageMetrics: evaluation.usage_metrics,
      createdAt: evaluation.created_at
    };
  } catch (error: any) {
    await recordEvent(sessionId, "evaluation.failed", `Evaluation failed: ${error.message}`);
    throw error;
  }
}
