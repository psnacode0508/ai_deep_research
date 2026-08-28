import { Request, Response, NextFunction } from "express";

/**
 * ApiError — a typed error class for HTTP errors thrown from controllers
 * and services. Attach a numeric `statusCode` so the error handler can
 * produce the correct HTTP response.
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Global Express error handler — must be registered LAST (after routes + 404).
 * Catches all errors forwarded via `next(err)`.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const isDevelopment = process.env["NODE_ENV"] !== "production";

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code ?? "API_ERROR",
        message: err.message,
      },
    });
    return;
  }

  // Unexpected errors — don't leak internal details in production
  console.error("[ERROR]", err);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isDevelopment ? err.message : "An unexpected error occurred.",
      ...(isDevelopment && { stack: err.stack }),
    },
  });
}
