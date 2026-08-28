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
    
    const newClaims = [];
    const extractionSchema = z.object({
      claims: z.array(z.object({
        claim: z.string().describe("A factual assertion found in the text"),
        confidence: z.number().min(0).max(1).describe("Confidence score between 0.0 and 1.0"),
        quote: z.string().describe("Exact quote from the text supporting the claim")
      })).max(3)
    });
    const structuredLlm = llm.withStructuredOutput(extractionSchema, { name: "EvidenceExtraction" });
    
    // Process sources sequentially to avoid rate limits, or batch them safely
    for (const source of state.sources) {
      try {
        const prompt = `Extract up to 3 key factual claims answering "${state.question}" from the following text.
Text: ${source.excerpt}

Only extract information explicitly stated in the text.`;
        
        const result = await structuredLlm.invoke(prompt);
        if (result && result.claims) {
          for (const c of result.claims) {
            const ev = await db.saveEvidence(source.task_id, state.sessionId, source.id, c.quote, c.confidence);
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
    
    const prompt = `You are an expert analyst. Write a concise, comprehensive research report answering the question: "${state.question}".
    
You MUST ONLY use the following established claims. Cite your sources inline using [Number] format corresponding to the claim index.
Do not invent or hallucinate information.

Claims:
${claimsText}

Output the report in Markdown format.`;

    const result = await llm.invoke(prompt);
    let finalReport = result.content as string;
    
    // Append citations section
    finalReport += "\n\n## References\n";
    allClaims.forEach((c: any, i: number) => {
      finalReport += `[${i+1}] ${c.source?.title || 'Source'} - ${c.source?.url}\n`;
    });
    
    await db.saveSessionReport(state.sessionId, finalReport);
    
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
  if (state.metadata.requirePlanApproval) return "pause_for_approval"; // Not implemented in graph yet
  return "execute_search";
}

function shouldContinueFromSearch(state: ResearchState) {
  if (state.error) return "fail";
  return "extract_evidence";
}

function shouldContinueFromExtract(state: ResearchState) {
  if (state.error) return "fail";
  return "synthesize_report";
}

function shouldContinueFromSynthesis(state: ResearchState) {
  if (state.error) return "fail";
  return "finalize_session";
}

// Build Graph
const workflow = new StateGraph<ResearchState>({ channels: stateChannels })
  .addNode("plan_research", planResearch)
  .addNode("execute_search", executeSearch)
  .addNode("extract_evidence", extractEvidence)
  .addNode("synthesize_report", synthesizeReport)
  .addNode("finalize_session", finalizeSession)
  .addNode("fail", async (state: ResearchState) => {
    await db.updateSessionStatus(state.sessionId, ResearchStatus.Failed, state.error);
    return {};
  });

workflow.addEdge(START, "plan_research");
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
  synthesize_report: "synthesize_report"
});
workflow.addConditionalEdges("synthesize_report", shouldContinueFromSynthesis, {
  fail: "fail",
  finalize_session: "finalize_session"
});
workflow.addEdge("finalize_session", END);
workflow.addEdge("fail", END);

export const app = workflow.compile();
