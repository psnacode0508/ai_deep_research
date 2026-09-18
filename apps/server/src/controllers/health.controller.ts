import { Request, Response } from "express";
import { supabaseAdmin } from "../db/supabase";
import { connection as redisClient } from "../queue";

// Read from package.json via require — avoids an extra dependency
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json") as { version: string };

/**
 * GET /health
 *
 * Returns a structured response confirming the server is running.
 * Used by load balancers, uptime monitors, and deployment health checks.
 */
export async function getHealth(req: Request, res: Response): Promise<void> {
  let dbStatus = "ok";
  let redisStatus = "ok";

  try {
    // Check DB health
    const { error } = await supabaseAdmin.from("profiles").select("id").limit(1);
    if (error) throw error;
  } catch (err) {
    dbStatus = "error";
  }

  try {
    // Check Redis health
    await redisClient.ping();
  } catch (err) {
    redisStatus = "error";
  }

  const isHealthy = dbStatus === "ok" && redisStatus === "ok";
  
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      status: isHealthy ? "ok" : "degraded",
      services: {
        api: "ok",
        database: dbStatus,
        redis: redisStatus
      },
      version,
      timestamp: new Date().toISOString(),
      environment: process.env["NODE_ENV"] ?? "development",
    },
  });
}
