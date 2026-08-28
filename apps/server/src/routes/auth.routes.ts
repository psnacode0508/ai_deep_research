import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { getMe } from "../controllers/auth.controller";

const router = Router();

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's safe profile.
 * Requires a valid Supabase JWT in Authorization: Bearer <token>
 */
router.get("/me", requireAuth, getMe);

export default router;
