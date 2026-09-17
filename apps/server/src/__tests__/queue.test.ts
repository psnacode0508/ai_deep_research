import { describe, it, expect, vi, beforeEach } from "vitest";
import { enqueueResearchJob, researchQueue } from "../queue";
import { ResearchEngine } from "../engine";

// Mock env config
vi.mock("../config/env", () => ({
  config: {
    redis: { url: "redis://localhost:6379" },
    server: { nodeEnv: "test", isProduction: false, isDevelopment: false },
    supabase: { url: "test", serviceRoleKey: "test", databaseUrl: "test" },
    gemini: { apiKey: "test", model: "test" },
    tavily: { apiKey: "test" },
  }
}));

// Mock BullMQ Queue
vi.mock("bullmq", () => {
  return {
    Queue: class QueueMock {
      add = vi.fn();
    },
    Worker: class WorkerMock {},
  };
});

// Mock ioredis
vi.mock("ioredis", () => {
  return {
    default: class RedisMock {
      on = vi.fn();
      disconnect = vi.fn();
    }
  };
});

describe("BullMQ Queue and Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should enqueue a job with the correct parameters (idempotency)", async () => {
    const sessionId = "session-123";
    const userId = "user-123";
    const metadata = { test: true };

    await enqueueResearchJob(sessionId, userId, metadata);

    expect(researchQueue.add).toHaveBeenCalledWith(
      "run-research",
      { sessionId, userId, metadata },
      expect.objectContaining({
        jobId: sessionId, // Prevents duplicates
        attempts: 3,
      })
    );
  });
});
