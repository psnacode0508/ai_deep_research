import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tavily } from "@tavily/core";
import { z } from "zod";
import { config } from "../config/env";
import * as db from "./db";
import { ResearchStatus } from "@deepresearch/shared";

// Ensure keys exist before creating clients
const llm = new ChatGoogleGenerativeAI({
  model: config.gemini.model,
  apiKey: config.gemini.apiKey,
  temperature: 0.2,
});

const searchClient = tavily({ apiKey: config.tavily.apiKey });

// Define the State
export interface ResearchState {
  sessionId: string;
  question: string;
  depth: string;
  metadata: any;
  tasks: any[];
  sources: any[];
  claims: any[];
  report: string | null;
  error?: string;
  iteration: number;
  gaps: any[];
  contradictions: any[];
  isSufficient: boolean;
}

const stateChannels = {
  sessionId: { value: (x: string, y: string) => y ?? x, default: () => "" },
  question: { value: (x: string, y: string) => y ?? x, default: () => "" },
  depth: { value: (x: string, y: string) => y ?? x, default: () => "standard" },
  metadata: { value: (x: any, y: any) => y ?? x, default: () => ({}) },
  tasks: { value: (x: any[], y: any[]) => y ?? x, default: () => [] },
  sources: { value: (x: any[], y: any[]) => x.concat(y || []), default: () => [] },
  claims: { value: (x: any[], y: any[]) => x.concat(y || []), default: () => [] },
  report: { value: (x: string | null, y: string | null) => y ?? x, default: () => null },
  error: { value: (x: string | undefined, y: string | undefined) => y ?? x, default: () => undefined },
  iteration: { value: (x: number, y: number) => (y !== undefined ? y : x), default: () => 0 },
  gaps: { value: (x: any[], y: any[]) => x.concat(y || []), default: () => [] },
  contradictions: { value: (x: any[], y: any[]) => x.concat(y || []), default: () => [] },
  isSufficient: { value: (x: boolean, y: boolean) => (y !== undefined ? y : x), default: () => false },
};

/**
 * 1. Planner Node
 */
async function planResearch(state: ResearchState) {
  try {
    await db.updateSessionStatus(state.sessionId, ResearchStatus.Planning);

    const taskCount = state.depth === 'quick' ? 2 : state.depth === 'deep' ? 6 : 4;
    
    const planSchema = z.object({
      tasks: z.array(z.object({
        objective: z.string().describe("What this task aims to achieve"),
        query: z.string().describe("The exact search query to use"),
      })).max(taskCount).min(1)
    });

    const structuredLlm = llm.withStructuredOutput(planSchema, { name: "ResearchPlan" });
    
    const prompt = `You are an expert research planner. Break down the following question into ${taskCount} distinct web search queries.
Question: ${state.question}

Respond with a JSON structure containing 'tasks'.`;

    const result = await structuredLlm.invoke(prompt);
    
    const saved = await db.saveResearchPlan(state.sessionId, result.tasks);
    
    if (state.metadata.requirePlanApproval) {
      await db.updateSessionStatus(state.sessionId, ResearchStatus.AwaitingPlanApproval);
    }

    return { tasks: saved.tasks };
  } catch (error: any) {
    return { error: `Planning failed: ${error.message}` };
  }
}

/**
 * 2. Parallel Search Node
 */
async function executeSearch(state: ResearchState) {
  try {
    await db.updateSessionStatus(state.sessionId, ResearchStatus.Researching);
    const pendingTasks = await db.getSessionTasks(state.sessionId);
    
    if (pendingTasks.length === 0) {
      return { sources: [] }; // No tasks to run
    }
    
    const allSources = [];
    
    // Execute searches in parallel
    const searchPromises = pendingTasks.map(async (task) => {
      await db.updateTaskStatus(task.id, 'researching');
      try {
        const response = await searchClient.search(task.query, {
          searchDepth: state.depth === 'deep' ? 'advanced' : 'basic',
          includeAnswer: false,
          includeRawContent: false,
          maxResults: 3
        });
        
        const savedSources = [];
        for (const res of response.results) {
          try {
            const domain = new URL(res.url).hostname;
            // Check exclusion
            if (state.metadata.excludeDomains?.includes(domain)) continue;
            
            const saved = await db.saveSource(task.id, state.sessionId, {
              url: res.url,
              title: res.title,
              domain,
              excerpt: res.content,
              full_content: res.content,
              relevance_score: res.score
            });
            savedSources.push(saved);
          } catch (e) {
            console.warn("Failed to process source", res.url);
          }
        }
        await db.updateTaskStatus(task.id, 'complete');
        return savedSources;
      } catch (err: any) {
        await db.updateTaskStatus(task.id, 'failed', err.message);
        return [];
      }
    });
    
    const results = await Promise.all(searchPromises);
    for (const res of results) allSources.push(...res);
    
    return { sources: allSources };
  } catch (error: any) {
    return { error: `Search failed: ${error.message}` };
  }
}

/**
 * 3. Extraction Node
 */
async function extractEvidence(state: ResearchState) {
  try {
    await db.updateSessionStatus(state.sessionId, ResearchStatus.Evaluating);
    
    // Fetch all sources and claims to avoid duplicate extraction
    const allSources = await db.getSessionSources(state.sessionId);
    const existingClaims = await db.getSessionClaims(state.sessionId);
    const extractedSourceIds = new Set(existingClaims.map((c: any) => c.source_id));
    const pendingSources = allSources.filter((s: any) => !extractedSourceIds.has(s.id));
    
    const newClaims = [];
    const extractionSchema = z.object({
      claims: z.array(z.object({
        claim: z.string().describe("A factual assertion found in the text"),
        confidence: z.number().min(0).max(1).describe("Confidence score between 0.0 and 1.0"),
        quote: z.string().describe("Exact quote from the text supporting the claim"),
        location_info: z.string().optional().describe("Location of the quote in the source, e.g. 'Page 3' or 'Section 2.1' if available")
      })).max(3)
    });
    const structuredLlm = llm.withStructuredOutput(extractionSchema, { name: "EvidenceExtraction" });
    
    // Process pending sources sequentially to avoid rate limits
    for (const source of pendingSources) {
      try {
        const textToProcess = source.full_content || source.excerpt || "";
        if (!textToProcess.trim()) continue;

        const prompt = `Extract up to 3 key factual claims answering "${state.question}" from the following text.
Text: ${textToProcess.substring(0, 25000)}

Only extract information explicitly stated in the text. If page numbers (e.g. '--- Page X ---') or section headers are present, include them in location_info.`;
        
        const result = await structuredLlm.invoke(prompt);
        if (result && result.claims) {
          for (const c of result.claims) {
            const ev = await db.saveEvidence(source.task_id, state.sessionId, source.id, c.quote, c.confidence, c.location_info);
            const savedClaim = await db.saveClaim(state.sessionId, ev.id, source.id, c.claim, c.confidence);
            newClaims.push(savedClaim);
          }
        }
      } catch (err) {
        console.warn(`Extraction failed for source ${source.id}`);
      }
    }
    
    return { claims: newClaims };
  } catch (error: any) {
    return { error: `Extraction failed: ${error.message}` };
  }
}

/**
 * 3.5 Reflection Node (M6)
 */
async function reflectOnEvidence(state: ResearchState) {
  try {
    await db.updateSessionStatus(state.sessionId, ResearchStatus.Reflecting);
    
    const allClaims = await db.getSessionClaims(state.sessionId);
    if (!allClaims || allClaims.length === 0) {
      return {
        isSufficient: false,
        gaps: [{ description: "No claims extracted yet", suggestedQuery: state.question, priority: "high", reason: "Zero evidence" }]
      };
    }
    
    let claimsText = allClaims.map((c: any, i: number) => `[ID:${c.id}] ${c.content}`).join("\n");
    
    const reflectionSchema = z.object({
      coverage_assessment: z.string().describe("Overall assessment of current evidence against the research question"),
      missing_evidence: z.array(z.string()).describe("List of missing crucial information"),
      weak_claims: z.array(z.string()).describe("Claims that lack strong support"),
      is_sufficient: z.boolean().describe("True if the evidence is sufficient to generate a final report"),
      gaps: z.array(z.object({
        description: z.string(),
        priority: z.enum(["low", "medium", "high"]),
        suggested_query: z.string().describe("The search query to fill this gap"),
        reason: z.string()
      })),
      contradictions: z.array(z.object({
        claimA_id: z.string(),
        claimB_id: z.string(),
        description: z.string().describe("Why these claims contradict"),
        severity: z.enum(["minor", "major", "critical"])
      }))
    });
    
    const structuredLlm = llm.withStructuredOutput(reflectionSchema, { name: "Reflection" });
    
    const prompt = `You are a critical research evaluator. Analyze the current evidence against the research question: "${state.question}".
    
Extracted Claims:
${claimsText}

1. Identify if the evidence is sufficient to answer the question comprehensively.
2. Identify any explicit gaps and suggest targeted follow-up search queries.
3. Identify any direct contradictions between the claims (use their ID exactly as provided). Remember that differences in date, region, or context are not necessarily contradictions unless they claim the same exact fact for the same context.`;

    const result = await structuredLlm.invoke(prompt);
    
    // Save contradictions
    const savedContradictions = [];
    if (result.contradictions) {
      for (const c of result.contradictions) {
        // Find if claim IDs exist to avoid foreign key errors in case LLM hallucinates IDs
        if (allClaims.find((x:any) => x.id === c.claimA_id) && allClaims.find((x:any) => x.id === c.claimB_id)) {
           const sc = await db.saveContradiction(state.sessionId, c.claimA_id, c.claimB_id, c.description, c.severity);
           savedContradictions.push(sc);
        }
      }
    }
    
    const newIteration = state.iteration + 1;
    
    // If not sufficient and within limits, schedule follow-ups
    const maxIterations = state.metadata.maxIterations || 3;
    let isActuallySufficient = result.is_sufficient;
    
    if (!isActuallySufficient && newIteration < maxIterations && result.gaps.length > 0) {
      const queries = result.gaps.map(g => g.suggested_query).slice(0, 3); // Max 3 follow-ups
      await db.saveFollowUpTasks(state.sessionId, queries);
    } else if (newIteration >= maxIterations) {
      isActuallySufficient = true; // Force completion
    }
    
    return { 
      isSufficient: isActuallySufficient,
      iteration: newIteration,
      gaps: result.gaps,
      contradictions: savedContradictions
    };
    
  } catch (error: any) {
    return { error: `Reflection failed: ${error.message}` };
  }
}

/**
 * 4. Synthesis Node
 */
async function synthesizeReport(state: ResearchState) {
  try {
    await db.updateSessionStatus(state.sessionId, ResearchStatus.Synthesising);
    
    const allClaims = await db.getSessionClaims(state.sessionId);
    if (!allClaims || allClaims.length === 0) {
       return { report: "No relevant evidence was found to answer the research question." };
    }
    
    let claimsText = allClaims.map((c: any, i: number) => `[${i+1}] ${c.content} (Source: ${c.source?.url})`).join("\n");
    
    const contradictionsText = state.contradictions.length > 0 
      ? state.contradictions.map((c, i) => `- ${c.description} (Severity: ${c.severity})`).join("\n") 
      : "None detected.";
      
    const gapsText = state.gaps.length > 0
      ? state.gaps.map((g, i) => `- ${g.description}`).join("\n")
      : "None detected.";
    
    const prompt = `You are an expert analyst. Write a concise, comprehensive research report answering the question: "${state.question}".
    
You MUST ONLY use the following established claims. Cite your sources inline using [Number] format corresponding to the claim index.
Do not invent or hallucinate information.

Your report MUST include these sections if applicable:
- Established Findings
- Conflicting Evidence (discuss the contradictions below)
- Unresolved Questions (discuss the gaps below)

Claims:
${claimsText}

Detected Contradictions:
${contradictionsText}

Unresolved Gaps:
${gapsText}

Output the report in Markdown format.`;

    const result = await llm.invoke(prompt);
    let finalReport = result.content as string;
    
    // Append citations section
    finalReport += "\n\n## References\n";
    allClaims.forEach((c: any, i: number) => {
      finalReport += `[${i+1}] ${c.source?.title || 'Source'} - ${c.source?.url}\n`;
    });
    
    await db.saveSessionReport(state.sessionId, finalReport);
    
    if (state.metadata.requireFinalApproval) {
      await db.updateSessionStatus(state.sessionId, ResearchStatus.AwaitingFinalApproval);
    }

    return { report: finalReport };
  } catch (error: any) {
    return { error: `Synthesis failed: ${error.message}` };
  }
}

/**
 * 5. Finalize Node
 */
async function finalizeSession(state: ResearchState) {
  await db.updateSessionStatus(state.sessionId, ResearchStatus.Complete);
  return {};
}

/**
 * Routing logic
 */
function shouldContinueFromPlan(state: ResearchState) {
  if (state.error) return "fail";
  if (state.metadata.requirePlanApproval) return "pause_for_approval";
  return "execute_search";
}

function shouldContinueFromSearch(state: ResearchState) {
  if (state.error) return "fail";
  return "extract_evidence";
}

function shouldContinueFromExtract(state: ResearchState) {
  if (state.error) return "fail";
  return "reflect_on_evidence";
}

function shouldContinueFromReflect(state: ResearchState) {
  if (state.error) return "fail";
  const maxIterations = state.metadata.maxIterations || 3;
  if (state.isSufficient || state.iteration >= maxIterations) {
    return "synthesize_report";
  }
  return "execute_search";
}

function shouldContinueFromSynthesis(state: ResearchState) {
  if (state.error) return "fail";
  if (state.metadata.requireFinalApproval) return "pause_for_approval";
  return "finalize_session";
}

// Build Graph
const workflow = new StateGraph<ResearchState>({ channels: stateChannels })
  .addNode("plan_research", planResearch)
  .addNode("execute_search", executeSearch)
  .addNode("extract_evidence", extractEvidence)
  .addNode("reflect_on_evidence", reflectOnEvidence)
  .addNode("synthesize_report", synthesizeReport)
  .addNode("finalize_session", finalizeSession)
  .addNode("fail", async (state: ResearchState) => {
    await db.updateSessionStatus(state.sessionId, ResearchStatus.Failed, state.error);
    return {};
  });

workflow.addConditionalEdges(START, (state: ResearchState & { currentStatus?: string }) => {
  if (state.currentStatus === ResearchStatus.AwaitingPlanApproval) return "execute_search";
  if (state.currentStatus === ResearchStatus.AwaitingFinalApproval) return "finalize_session";
  
  const terminalStates = [
    ResearchStatus.PlanRejected,
    ResearchStatus.FinalRejected,
    ResearchStatus.Complete,
    ResearchStatus.Failed,
    ResearchStatus.Cancelled
  ];
  if (state.currentStatus && terminalStates.includes(state.currentStatus as ResearchStatus)) {
    return "end_node";
  }

  const activeStates = [
    ResearchStatus.Researching,
    ResearchStatus.Evaluating,
    ResearchStatus.Reflecting,
    ResearchStatus.FollowingUp,
    ResearchStatus.Synthesising
  ];
  if (state.currentStatus && activeStates.includes(state.currentStatus as ResearchStatus)) {
    return "execute_search";
  }

  return "plan_research";
}, {
  plan_research: "plan_research",
  execute_search: "execute_search",
  finalize_session: "finalize_session",
  end_node: END
});

workflow.addConditionalEdges("plan_research", shouldContinueFromPlan, {
  fail: "fail",
  execute_search: "execute_search",
  pause_for_approval: END
});
workflow.addConditionalEdges("execute_search", shouldContinueFromSearch, {
  fail: "fail",
  extract_evidence: "extract_evidence"
});
workflow.addConditionalEdges("extract_evidence", shouldContinueFromExtract, {
  fail: "fail",
  reflect_on_evidence: "reflect_on_evidence"
});
workflow.addConditionalEdges("reflect_on_evidence", shouldContinueFromReflect, {
  fail: "fail",
  execute_search: "execute_search",
  synthesize_report: "synthesize_report"
});
workflow.addConditionalEdges("synthesize_report", shouldContinueFromSynthesis, {
  fail: "fail",
  finalize_session: "finalize_session",
  pause_for_approval: END
});
workflow.addEdge("finalize_session", END);
workflow.addEdge("fail", END);

export const app = workflow.compile();
