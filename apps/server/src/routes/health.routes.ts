import { Router } from "express";
import { getHealth } from "../controllers/health.controller";

const router = Router();

/**
 * GET /health
 * Health check endpoint — used by monitoring, load balancers, and CI.
 */
router.get("/", getHealth);

export default router;
