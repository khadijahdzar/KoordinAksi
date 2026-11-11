import { Router } from "express";
import {
  getActivities,
  getAuditLogs,
  getMetrics,
  getStats,
  getVerifications,
  getVolunteers,
  moderateEntity
} from "../controllers/adminController.js";
import { verifyAdminToken } from "../middleware/adminAuth.js";

const router = Router();

router.use(verifyAdminToken);
router.get("/stats", getStats);
router.get("/metrics", getMetrics);
router.get("/verifications", getVerifications);
router.get("/activities", getActivities);
router.get("/volunteers-database", getVolunteers);
router.get("/audit-logs", getAuditLogs);
router.patch("/verify/:id", moderateEntity);

export default router;
