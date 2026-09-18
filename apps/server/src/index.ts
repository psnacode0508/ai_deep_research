import express from "express";
import cors from "cors";
import helmet from "helmet";

import { config } from "./config/env";
import { requestLogger } from "./middleware/logger";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

import healthRouter from "./routes/health.routes";
import authRouter from "./routes/auth.routes";
import researchRouter from "./routes/research.routes";
import shareRouter from "./routes/share.routes";

// ─────────────────────────────────────────────
// Create Express application
// ─────────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────────
// Security middleware
// ─────────────────────────────────────────────
app.use(
  helmet({
    // Content-Security-Policy can be tightened per environment in a later milestone
    contentSecurityPolicy: config.server.isProduction,
  })
);

app.use(
  cors({
    origin: config.cors.frontendUrl,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ─────────────────────────────────────────────
// Parsing middleware
// ─────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// Request logging
// ─────────────────────────────────────────────
app.use(requestLogger);

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.use("/health", healthRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/research", researchRouter);
app.use("/api/v1/share", shareRouter);

// Future routes will be mounted here, e.g.:
//   app.use("/api/v1/sessions", sessionsRouter);

// ─────────────────────────────────────────────
// 404 + global error handler (must be last)
// ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────
const { port, nodeEnv } = config.server;

app.listen(port, () => {
  console.log(
    `\n🚀 DeepResearch API server running\n` +
      `   Environment : ${nodeEnv}\n` +
      `   Port        : ${port}\n` +
      `   Health      : http://localhost:${port}/health\n`
  );
});

export default app;
