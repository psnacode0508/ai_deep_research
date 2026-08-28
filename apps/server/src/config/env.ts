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
    frontendUrl: optionalEnv("FRONTEND_URL", "http://localhost:5173"),
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
    model: optionalEnv("GEMINI_MODEL", "gemini-2.5-flash"),
  },
  tavily: {
    apiKey: requireEnv("TAVILY_API_KEY"),
  },

  // ── Background Jobs ────────────────────────────────────
  // Not validated at startup — will be required in a later milestone.
  redis: {
    url: process.env["REDIS_URL"] ?? "",
  },
} as const;

export type Config = typeof config;
