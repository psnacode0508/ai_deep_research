import { describe, it, expect, vi, beforeEach } from 'vitest';
// Mock DB
vi.mock('../engine/db', () => ({
  updateSessionStatus: vi.fn(),
  saveResearchPlan: vi.fn().mockResolvedValue({ tasks: [{ id: '1' }] }),
  getSessionTasks: vi.fn().mockResolvedValue([{ id: '1', query: 'test query' }]),
  updateTaskStatus: vi.fn(),
  saveSource: vi.fn().mockResolvedValue({ id: 'src-1' }),
  saveEvidence: vi.fn().mockResolvedValue({ id: 'ev-1' }),
  saveClaim: vi.fn().mockResolvedValue({ id: 'cl-1' }),
  getSessionSources: vi.fn().mockResolvedValue([
    { id: 'source-1', url: 'http://test.com', full_content: 'test content' },
    { id: 'source-2', url: 'http://example.com', full_content: 'new content' }
  ]),
  getSessionClaims: vi.fn().mockResolvedValue([{ id: 'cl-1', content: 'test claim', source_id: 'source-1', source: { url: 'http://test.com' } }]),
  saveSessionReport: vi.fn(),
}));

// Mock LLM
vi.mock('@langchain/google-genai', () => {
  return {
    ChatGoogleGenerativeAI: class {
      withStructuredOutput(schema: any, config: any) {
        if (config.name === "Reflection") {
          return {
            invoke: vi.fn().mockResolvedValue({
              coverage_assessment: "Testing",
              missing_evidence: [],
              weak_claims: [],
              is_sufficient: true,
              gaps: [],
              contradictions: []
            })
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

describe('Research Engine Graph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully run the full graph workflow', async () => {
    const initialState = {
      sessionId: 'test-session',
      question: 'What is deep research?',
      depth: 'quick',
      metadata: {},
      tasks: [],
      sources: [],
      claims: [],
      report: null
    };

    const finalState = await app.invoke(initialState);
    
    // Planner
    expect(db.updateSessionStatus).toHaveBeenCalledWith('test-session', 'planning');
    expect(db.saveResearchPlan).toHaveBeenCalled();
    
    // Search
    expect(db.updateSessionStatus).toHaveBeenCalledWith('test-session', 'researching');
    expect(db.getSessionTasks).toHaveBeenCalledWith('test-session');
    expect(db.saveSource).toHaveBeenCalled();
    
    // Extract
    expect(db.updateSessionStatus).toHaveBeenCalledWith('test-session', 'evaluating');
    expect(db.saveEvidence).toHaveBeenCalled();
    expect(db.saveClaim).toHaveBeenCalled();
    
    // Synthesize
    expect(db.updateSessionStatus).toHaveBeenCalledWith('test-session', 'synthesising');
    expect(db.getSessionClaims).toHaveBeenCalledWith('test-session');
    expect(db.saveSessionReport).toHaveBeenCalled();
    
    // Finalize
    expect(db.updateSessionStatus).toHaveBeenCalledWith('test-session', 'complete');
    
    expect(finalState.error).toBeUndefined();
  });
});
