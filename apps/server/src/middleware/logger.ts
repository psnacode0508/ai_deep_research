import { Request, Response, NextFunction } from "express";

/**
 * Simple request logger middleware.
 * Logs method, path, status code, and response time.
 * In production, replace with a structured logger (e.g. pino, winston).
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const { method, path: urlPath } = req;

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const { statusCode } = res;

    const level = statusCode >= 500 ? "ERROR" : statusCode >= 400 ? "WARN" : "INFO";

    console.log(
      `[${level}] ${new Date().toISOString()} ${method} ${urlPath} → ${statusCode} (${durationMs}ms)`
    );
  });

  next();
}
