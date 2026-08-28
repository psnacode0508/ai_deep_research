import { supabaseAdmin } from "../db/supabase";
import { ResearchStatus } from "@deepresearch/shared";

/**
 * Update the status of a research session.
 */
export async function updateSessionStatus(sessionId: string, status: ResearchStatus, error?: string) {
  const payload: any = { status };
  if (error) payload.error_message = error;
  
  const { error: dbError } = await supabaseAdmin
    .from("research_sessions")
    .update(payload)
    .eq("id", sessionId);
    
  if (dbError) throw new Error(`Failed to update session status: ${dbError.message}`);
}

/**
 * Save a generated research plan and its tasks to the database.
 */
export async function saveResearchPlan(sessionId: string, tasks: any[]) {
  // 1. Insert plan
  const { data: plan, error: planError } = await supabaseAdmin
    .from("research_plans")
    .insert({
      session_id: sessionId,
      task_count: tasks.length,
      raw_plan: tasks
    })
    .select()
    .single();
    
  if (planError || !plan) throw new Error(`Failed to save plan: ${planError?.message}`);

  // 2. Insert tasks
  const taskRows = tasks.map((t, i) => ({
    session_id: sessionId,
    plan_id: plan.id,
    query: t.query || t.research_question || t.objective,
    task_index: i,
    status: 'pending'
  }));
  
  const { data: savedTasks, error: tasksError } = await supabaseAdmin
    .from("research_tasks")
    .insert(taskRows)
    .select();
    
  if (tasksError) throw new Error(`Failed to save tasks: ${tasksError.message}`);
  
  return { plan, tasks: savedTasks };
}

export async function getSessionTasks(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("research_tasks")
    .select("*")
    .eq("session_id", sessionId)
    .eq("status", "pending")
    .order("task_index", { ascending: true });
    
  if (error) throw new Error(`Failed to fetch tasks: ${error.message}`);
  return data;
}

export async function updateTaskStatus(taskId: string, status: string, errorMsg?: string) {
  const payload: any = { status };
  if (errorMsg) payload.error_message = errorMsg;
  if (status === 'researching') payload.started_at = new Date().toISOString();
  if (status === 'complete' || status === 'failed') payload.completed_at = new Date().toISOString();
  
  await supabaseAdmin
    .from("research_tasks")
    .update(payload)
    .eq("id", taskId);
}

export async function saveSource(taskId: string, sessionId: string, source: any) {
  const { data, error } = await supabaseAdmin
    .from("research_sources")
    .insert({
      task_id: taskId,
      session_id: sessionId,
      url: source.url,
      title: source.title,
      domain: source.domain,
      excerpt: source.excerpt,
      full_content: source.full_content,
      relevance_score: source.relevance_score || null
    })
    .select()
    .single();
    
  if (error) throw new Error(`Failed to save source: ${error.message}`);
  return data;
}

export async function saveEvidence(taskId: string, sessionId: string, sourceId: string, content: string, relevance?: number) {
  const { data, error } = await supabaseAdmin
    .from("evidence")
    .insert({
      task_id: taskId,
      session_id: sessionId,
      source_id: sourceId,
      content,
      relevance_score: relevance || null
    })
    .select()
    .single();
    
  if (error) throw new Error(`Failed to save evidence: ${error.message}`);
  return data;
}

export async function saveClaim(sessionId: string, evidenceId: string, sourceId: string, content: string, confidence: number) {
  const { data, error } = await supabaseAdmin
    .from("claims")
    .insert({
      session_id: sessionId,
      evidence_id: evidenceId,
      source_id: sourceId,
      content,
      confidence
    })
    .select()
    .single();
    
  if (error) throw new Error(`Failed to save claim: ${error.message}`);
  return data;
}

export async function getSessionClaims(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("claims")
    .select("*, source:research_sources(url, title)")
    .eq("session_id", sessionId);
    
  if (error) throw new Error(`Failed to fetch claims: ${error.message}`);
  return data;
}

export async function saveSessionReport(sessionId: string, report: string) {
  // Update the metadata with the report instead of a direct column if it doesn't exist?
  // Let me check the ResearchSession schema. It has a 'report' column? 
  // Wait, I need to verify the table schema. I'll just append it to metadata for now if 'report' column doesn't exist, or use a separate query.
  // Actually, I didn't add 'report' column in M2. Wait, let me check M2 schema again.
  // M2 schema didn't have 'report' column. It only had 'metadata'.
  
  // I will fetch existing metadata and merge.
  const { data: session } = await supabaseAdmin.from("research_sessions").select("metadata").eq("id", sessionId).single();
  const metadata = session?.metadata || {};
  metadata.report = report;
  
  const { error } = await supabaseAdmin
    .from("research_sessions")
    .update({ metadata })
    .eq("id", sessionId);
    
  if (error) throw new Error(`Failed to save report: ${error.message}`);
}

export async function saveContradiction(sessionId: string, claimAId: string, claimBId: string, description: string, severity: string) {
  const { data, error } = await supabaseAdmin
    .from("contradictions")
    .insert({
      session_id: sessionId,
      claim_a_id: claimAId,
      claim_b_id: claimBId,
      description,
      severity
    })
    .select()
    .single();
    
  if (error) throw new Error(`Failed to save contradiction: ${error.message}`);
  return data;
}

export async function saveFollowUpTasks(sessionId: string, queries: string[]) {
  // First, get the plan ID for this session
  const { data: plan, error: planError } = await supabaseAdmin
    .from("research_plans")
    .select("id")
    .eq("session_id", sessionId)
    .single();
    
  if (planError || !plan) throw new Error(`Failed to find plan for follow-up: ${planError?.message}`);
  
  const taskRows = queries.map((query, i) => ({
    session_id: sessionId,
    plan_id: plan.id,
    query,
    task_index: 100 + i, // Arbitrary high index for follow-ups
    status: 'pending',
    is_followup: true
  }));
  
  const { data, error } = await supabaseAdmin
    .from("research_tasks")
    .insert(taskRows)
    .select();
    
  if (error) throw new Error(`Failed to save follow-up tasks: ${error.message}`);
  return data;
}
