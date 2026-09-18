import rateLimit from "express-rate-limit";
import { config } from "../config/env";

/**
 * Global API rate limiter configured via environment variables.
 * Used to protect against basic DoS and brute-force attacks.
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests from this IP, please try again later."
    }
  }
});

/**
 * Stricter rate limiter for sensitive endpoints (e.g., auth, research creation).
 * Limits to 1/10th of the global limit (min 5).
 */
export const strictRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: Math.max(5, Math.floor(config.rateLimit.maxRequests / 10)),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Rate limit exceeded for sensitive operation. Please try again later."
    }
  }
});
