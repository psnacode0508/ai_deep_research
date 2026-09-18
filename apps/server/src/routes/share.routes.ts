import { Router } from "express";
import { getPublicSharedReport } from "../controllers/share.controller";
import { strictRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Public unauthenticated route
router.get("/:token", strictRateLimiter, getPublicSharedReport);

export default router;
