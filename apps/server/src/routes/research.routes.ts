import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createResearchSession,
  getResearchSession,
  listResearchSessions,
  deleteResearchSession,
  streamResearchEvents,
  cancelResearchSession
} from "../controllers/research.controller";

const router = Router();

// All research routes require authentication
router.use(requireAuth);

router.post("/", createResearchSession);
router.get("/", listResearchSessions);
router.get("/:id", getResearchSession);
router.get("/:id/events", streamResearchEvents);
router.post("/:id/cancel", cancelResearchSession);
router.delete("/:id", deleteResearchSession);

export default router;
