import { Request, Response, NextFunction } from "express";

/**
 * 404 handler — must be registered AFTER all routes.
 * Returns a structured JSON response so API clients get consistent errors.
 */
export function notFound(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.path}`,
    },
  });
}
