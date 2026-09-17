import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { config } from "./config/env";
import { ResearchEngine } from "./engine";
import { supabaseAdmin } from "./db/supabase";
import { ResearchStatus } from "@deepresearch/shared";

console.log(`[Worker] Starting Research Worker...`);
console.log(`[Worker] Environment: ${config.server.nodeEnv}`);
console.log(`[Worker] Redis URL: ${config.redis.url}`);

const connection = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "research-queue",
  async (job: Job) => {
    const { sessionId, userId } = job.data;
    console.log(`[Worker] Processing job ${job.id} for session ${sessionId}`);

    try {
      // Check if session is already cancelled
      const { data: session } = await supabaseAdmin
        .from("research_sessions")
        .select("status")
        .eq("id", sessionId)
        .single();
        
      if (session?.status === ResearchStatus.Cancelled) {
        console.log(`[Worker] Job ${job.id} skipped, session ${sessionId} was cancelled.`);
        return;
      }

      // Execute the existing ResearchEngine
      await ResearchEngine.startResearch(sessionId);
      console.log(`[Worker] Finished processing job ${job.id} for session ${sessionId}`);
    } catch (error: any) {
      console.error(`[Worker] Error processing job ${job.id} for session ${sessionId}:`, error);
      // Persist failure status if graph failed entirely
      await supabaseAdmin
        .from("research_sessions")
        .update({ 
          status: ResearchStatus.Failed,
          error_message: error.message || "Unknown error occurred during execution."
        })
        .eq("id", sessionId);
        
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection,
    concurrency: 5, // Reasonable concurrency limit
    // Stalled job handling is enabled by default in BullMQ.
  }
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("[Worker] Shutting down gracefully...");
  await worker.close();
  connection.disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
