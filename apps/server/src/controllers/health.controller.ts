import { Request, Response } from "express";

// Read from package.json via require — avoids an extra dependency
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json") as { version: string };

/**
 * GET /health
 *
 * Returns a structured response confirming the server is running.
 * Used by load balancers, uptime monitors, and deployment health checks.
 */
export function getHealth(req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      version,
      timestamp: new Date().toISOString(),
      environment: process.env["NODE_ENV"] ?? "development",
    },
  });
}
