import { Queue } from "bullmq";
import Redis from "ioredis";
import { config } from "../config/env";

export const connection = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
});

export const researchQueue = new Queue("research-queue", { connection });

export async function enqueueResearchJob(
  sessionId: string,
  userId: string,
  metadata: any
) {
  await researchQueue.add(
    "run-research",
    { sessionId, userId, metadata },
    {
      jobId: sessionId, // Ensures idempotency (prevent duplicate jobs for the same session)
      attempts: 3, // Reliability: Retries
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

export async function resumeResearchJob(
  sessionId: string,
  userId: string,
  stage: string
) {
  await researchQueue.add(
    "run-research",
    { sessionId, userId, stage },
    {
      jobId: `${sessionId}-${stage}`, // Ensures idempotency per stage
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}
