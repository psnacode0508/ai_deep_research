/**
 * Environment configuration
 *
 * Centralises all process.env access so that the rest of the codebase
 * never reads raw `process.env` strings. Every value is validated at
 * startup so the server fails fast on misconfiguration.
 */

import dotenv from "dotenv";
import path from "path";

// Load .env from the server app directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Copy .env.example to .env and fill in the value.`
    );
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const config = {
  server: {
    port: parseInt(optionalEnv("PORT", "4000"), 10),
    nodeEnv: optionalEnv("NODE_ENV", "development"),
    isProduction: optionalEnv("NODE_ENV", "development") === "production",
    isDevelopment: optionalEnv("NODE_ENV", "development") === "development",
  },
  cors: {
    // In production, restrict to the deployed frontend URL.
    // Allow comma-separated lists for multiple origins.
    frontendUrls: optionalEnv("FRONTEND_URL", "http://localhost:5173").split(",").map(s => s.trim()),
  },

  // ── Supabase ──────────────────────────────────────────
  // Required now that authentication is active (Milestone 1).
  supabase: {
    url: requireEnv("SUPABASE_URL"),
    serviceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    databaseUrl: process.env["DATABASE_URL"] ?? "",
  },

  // ── AI / Research ─────────────────────────────────────
  gemini: {
    apiKey: requireEnv("GEMINI_API_KEY"),
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    inputCostPerMillion: Number(process.env.GEMINI_INPUT_COST_PER_M || "0.50"),
    outputCostPerMillion: Number(process.env.GEMINI_OUTPUT_COST_PER_M || "1.50")
  },
  tavily: {
    apiKey: requireEnv("TAVILY_API_KEY"),
    costPerThousand: Number(process.env.TAVILY_COST_PER_K || "5.00")
  },

  // ── Background Jobs ────────────────────────────────────
  redis: {
    url: optionalEnv("REDIS_URL", "redis://localhost:6379"),
  },

  // ── Security / Rate Limiting ────────────────────────────
  rateLimit: {
    windowMs: parseInt(optionalEnv("RATE_LIMIT_WINDOW_MS", "900000"), 10), // 15 minutes default
    maxRequests: parseInt(optionalEnv("RATE_LIMIT_MAX_REQUESTS", "100"), 10),
  }
} as const;

export type Config = typeof config;
