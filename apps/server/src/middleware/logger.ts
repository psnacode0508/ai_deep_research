import { Request, Response, NextFunction } from "express";
import { config } from "../config/env";

/**
 * Simple request logger middleware.
 * In production, it logs a structured JSON string.
 * In development, it logs a human-readable string.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const { method, path: urlPath, ip } = req;

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const { statusCode } = res;

    const level = statusCode >= 500 ? "ERROR" : statusCode >= 400 ? "WARN" : "INFO";

    if (config.server.isProduction) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        method,
        path: urlPath,
        statusCode,
        durationMs,
        ip,
        userId: (req as any).user?.id
      }));
    } else {
      console.log(
        `[${level}] ${new Date().toISOString()} ${method} ${urlPath} → ${statusCode} (${durationMs}ms)`
      );
    }
  });

  next();
}
