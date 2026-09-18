import { evaluateResearchSession } from "../engine/evaluation";
import { supabaseAdmin } from "../db/supabase";
import { vi, describe, it, expect, afterEach } from "vitest";

vi.mock("../config/env", () => ({
  config: {
    supabase: { url: "http://localhost", serviceRoleKey: "key" },
    gemini: { apiKey: "key", model: "model" },
    tavily: { apiKey: "key" }
  }
}));

vi.mock("../db/supabase", () => ({
  supabaseAdmin: {
    from: vi.fn()
  }
}));

vi.mock("../engine/db", () => ({
  recordEvent: vi.fn()
}));

describe("Evaluation Service", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should correctly calculate evaluation metrics", async () => {
    const mockSessionId = "session-123";
    const mockUserId = "user-123";

    // Create a chainable mock builder for supabaseAdmin.from
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockReturnThis();
    const mockSingle = vi.fn();
    const mockInsert = vi.fn().mockReturnThis();

    (supabaseAdmin.from as any).mockImplementation((table: string) => {
      const builder = {
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        single: mockSingle,
        insert: mockInsert
      };

      mockEq.mockImplementation((field, val) => {
        if (field === "session_id" || field === "report.session_id") {
          const thenable = {
            then: (resolve: any) => {
              if (table === "research_sources") resolve({ data: [{ id: "s1", domain: "example.com" }, { id: "s2", domain: "test.com" }] });
              else if (table === "evidence") resolve({ data: [{ id: "e1", source_id: "s1" }] });
              else if (table === "claims") resolve({ data: [{ id: "c1", evidence_id: "e1" }, { id: "c2", evidence_id: null }] });
              else if (table === "citations") resolve({ data: [{ id: "cit1", source_id: "s1" }, { id: "cit2", source_id: null }] });
              else if (table === "research_tasks") resolve({ data: [{ id: "t1", is_followup: true }] });
              else if (table === "usage_metrics") resolve({ data: [{ metric_type: "llm_input_tokens", value: 1000000 }] });
              else if (table === "contradictions") resolve({ data: [{ id: "con1", resolved: false }] });
              else if (table === "research_events") {
                 resolve({ data: [
                    { event_type: "planning.started", created_at: "2026-09-01T00:00:00Z" },
                    { event_type: "planning.completed", created_at: "2026-09-01T00:00:10Z" },
                    { event_type: "task.failed", payload: { retry: true } }
                 ]});
              }
            },
            order: () => thenable
          };
          return thenable;
        }
        return builder;
      });

      // Handle insert query
      mockSingle.mockImplementation(() => {
        return Promise.resolve({
          data: {
            id: "eval-123",
            session_id: mockSessionId,
            quality_metrics: {
              evidenceCoverage: 0.5,
              claimToEvidenceLinkage: 0.5,
              citationCompleteness: 0.5
            },
            source_metrics: { sourceDiversity: 2 },
            performance_metrics: { planningDurationMs: 10000 },
            usage_metrics: { inputTokens: 1000000, estimatedGeminiCost: 0.5 },
            created_at: new Date().toISOString()
          },
          error: null
        });
      });

      return builder;
    });

    const result = await evaluateResearchSession(mockSessionId, mockUserId);
    
    expect(result).toBeDefined();
    expect(result.id).toBe("eval-123");
    
    // Verify insert was called with calculated metrics
    expect(mockInsert).toHaveBeenCalled();
    const insertPayload = mockInsert.mock.calls[0][0];
    
    expect(insertPayload.session_id).toBe(mockSessionId);
    expect(insertPayload.user_id).toBe(mockUserId);
    
    // Evidence coverage: 1 source out of 2 has evidence -> 0.5
    expect(insertPayload.quality_metrics.evidenceCoverage).toBe(0.5);
    // Linkage: 1 claim out of 2 has evidence -> 0.5
    expect(insertPayload.quality_metrics.claimToEvidenceLinkage).toBe(0.5);
    // Completeness: 1 citation out of 2 has source -> 0.5
    expect(insertPayload.quality_metrics.citationCompleteness).toBe(0.5);
    
    // Diversity: 2 distinct domains
    expect(insertPayload.source_metrics.sourceDiversity).toBe(2);
    
    // Duration: 10 seconds difference in planning
    expect(insertPayload.performance_metrics.planningDurationMs).toBe(10000);
    expect(insertPayload.performance_metrics.workerRetries).toBe(1);
    
    // Cost: 1M tokens * $0.50 = $0.50
    expect(insertPayload.usage_metrics.estimatedGeminiCost).toBe(0.5);
    expect(insertPayload.usage_metrics.totalEstimatedCost).toBe(0.5);
  });
});
