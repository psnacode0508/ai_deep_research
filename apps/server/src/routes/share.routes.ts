import { Router } from "express";
import { getPublicSharedReport } from "../controllers/share.controller";

const router = Router();

// Public unauthenticated route
router.get("/:token", getPublicSharedReport);

export default router;
