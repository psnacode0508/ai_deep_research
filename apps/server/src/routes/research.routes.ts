import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import {
  createResearchSession,
  getResearchSession,
  listResearchSessions,
  deleteResearchSession,
  streamResearchEvents,
  cancelResearchSession,
  approvePlan,
  rejectPlan,
  approveReport,
  rejectReport,
  attachSource,
  getEvaluation
} from "../controllers/research.controller";
import multer from "multer";

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.memoryStorage()
});

const router = Router();

// All research routes require authentication
router.use(requireAuth);

router.post("/", createResearchSession);
router.get("/", listResearchSessions);
router.get("/:id", getResearchSession);
router.get("/:id/events", streamResearchEvents);
router.get("/:id/evaluation", getEvaluation);
router.post("/:id/cancel", cancelResearchSession);
router.post("/:id/plan/approve", approvePlan);
router.post("/:id/plan/reject", rejectPlan);
router.post("/:id/report/approve", approveReport);
router.post("/:id/report/reject", rejectReport);
router.post("/:id/sources", upload.single("file"), attachSource);
router.delete("/:id", deleteResearchSession);

export default router;
