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
  getEvaluation,
  exportMarkdown,
  exportPDF,
  exportDOCX
} from "../controllers/research.controller";
import {
  getShareStatus,
  enableShare,
  revokeShare
} from "../controllers/share.controller";
import multer from "multer";

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.memoryStorage()
});

import { strictRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// All research routes require authentication
router.use(requireAuth);

router.post("/", strictRateLimiter, createResearchSession);
router.get("/", listResearchSessions);
router.get("/:id", getResearchSession);
router.get("/:id/events", streamResearchEvents);
router.get("/:id/evaluation", getEvaluation);
router.post("/:id/cancel", cancelResearchSession);
router.post("/:id/plan/approve", approvePlan);
router.post("/:id/plan/reject", rejectPlan);
router.post("/:id/report/approve", approveReport);
router.post("/:id/report/reject", rejectReport);
router.post("/:id/sources", strictRateLimiter, upload.single("file"), attachSource);
router.delete("/:id", deleteResearchSession);

// Export
router.get("/:id/export/markdown", exportMarkdown);
router.get("/:id/export/pdf", exportPDF);
router.get("/:id/export/docx", exportDOCX);

// Sharing
router.get("/:id/share", getShareStatus);
router.post("/:id/share", enableShare);
router.delete("/:id/share", revokeShare);

export default router;
