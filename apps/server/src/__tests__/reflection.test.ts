import { describe, it, expect, vi, beforeEach } from 'vitest';
// Mock DB
vi.mock('../engine/db', () => ({
  updateSessionStatus: vi.fn(),
  saveResearchPlan: vi.fn().mockResolvedValue({ tasks: [{ id: '1' }] }),
  getSessionTasks: vi.fn().mockResolvedValue([{ id: '1', query: 'test query' }]),
  updateTaskStatus: vi.fn(),
  saveSource: vi.fn().mockResolvedValue({ id: 'src-1' }),
  saveEvidence: vi.fn().mockResolvedValue({ id: 'ev-1' }),
  saveClaim: vi.fn().mockResolvedValue({ id: 'claim-1' }),
  getSessionSources: vi.fn().mockResolvedValue([{ id: 'source-1', url: 'http://test.com', full_content: 'test content' }]),
  getSessionClaims: vi.fn().mockResolvedValue([
    { id: 'cl-1', content: 'claim 1', source: { url: 'http://test.com' } },
    { id: 'cl-2', content: 'claim 2', source: { url: 'http://test.com' } },
    { id: 'cl-3', content: 'claim 3', source: { url: 'http://test.com' } }
  ]),
  saveSessionReport: vi.fn(),
  saveContradiction: vi.fn().mockResolvedValue({ id: 'con-1' }),
  saveFollowUpTasks: vi.fn().mockResolvedValue([{ id: '2' }])
}));

// Mock LLM
let isSufficientMock = false;
let gapsMock: any[] = [];
let contradictionsMock: any[] = [];

vi.mock('@langchain/google-genai', () => {
  return {
    ChatGoogleGenerativeAI: class {
      withStructuredOutput(schema: any, config: any) {
        if (config.name === "Reflection") {
          return {
            invoke: vi.fn().mockImplementation(async () => ({
              coverage_assessment: "Testing",
              missing_evidence: [],
              weak_claims: [],
              is_sufficient: isSufficientMock,
              gaps: gapsMock,
              contradictions: contradictionsMock
            }))
          };
        }
        return {
          invoke: vi.fn().mockResolvedValue({
            tasks: [{ objective: 'Test', query: 'test query' }],
            claims: [{ claim: 'test claim', confidence: 0.9, quote: 'test quote' }]
          })
        };
      }
      async invoke() {
        return { content: 'Test report' };
      }
    }
  };
});

// Mock Tavily
vi.mock('@tavily/core', () => ({
  tavily: vi.fn().mockReturnValue({
    search: vi.fn().mockResolvedValue({
      results: [
        { url: 'http://test.com', title: 'Test', content: 'Test content', score: 0.9 }
      ]
    })
  })
}));

// Mock Env
vi.mock('../config/env', () => ({
  config: {
    gemini: { apiKey: 'test', model: 'test-model' },
    tavily: { apiKey: 'test' },
    supabase: { url: 'http://test', serviceRoleKey: 'test', databaseUrl: '' }
  }
}));

import { app } from '../engine/graph';
import * as db from '../engine/db';

describe('Reflection and Iterative Loop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes to synthesis when sufficient', async () => {
    isSufficientMock = true;
    gapsMock = [];
    contradictionsMock = [];

    const initialState = {
      sessionId: 'test-session',
      question: 'What is deep research?',
      depth: 'quick',
      metadata: { maxIterations: 3 },
      tasks: [],
      sources: [],
      claims: [],
      report: null,
      iteration: 0,
      gaps: [],
      contradictions: [],
      isSufficient: false
    };

    const finalState = await app.invoke(initialState);
    
    // Should end at synthesis and complete
    expect(db.updateSessionStatus).toHaveBeenCalledWith('test-session', 'synthesising');
    expect(db.updateSessionStatus).toHaveBeenCalledWith('test-session', 'complete');
    expect(db.saveFollowUpTasks).not.toHaveBeenCalled();
    expect(finalState.isSufficient).toBe(true);
    expect(finalState.iteration).toBe(1);
  });

  it('routes to follow-up search when insufficient and iteration limit not reached', async () => {
    isSufficientMock = false;
    gapsMock = [{ description: 'Need more data', priority: 'high', suggested_query: 'more data', reason: 'gap' }];
    contradictionsMock = [];

    // Since we mock the graph to run all the way, it will loop. 
    // To test just the routing step, we can't easily pause without breakpoints.
    // But we can observe that it incremented iterations and saved follow-ups.
    
    // Actually, because our mock for `isSufficient` is global and stays `false`, 
    // it will loop until `iteration >= maxIterations`.
    
    const initialState = {
      sessionId: 'test-session',
      question: 'What is deep research?',
      depth: 'quick',
      metadata: { maxIterations: 2 },
      tasks: [],
      sources: [],
      claims: [],
      report: null,
      iteration: 0,
      gaps: [],
      contradictions: [],
      isSufficient: false
    };

    const finalState = await app.invoke(initialState);
    
    // Should have saved follow-up tasks
    expect(db.saveFollowUpTasks).toHaveBeenCalled();
    // Reached max iterations (2)
    expect(finalState.iteration).toBe(2);
    // Forced sufficient
    expect(finalState.isSufficient).toBe(true);
  });
});
