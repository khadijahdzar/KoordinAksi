import { Router } from "express";
import {
  getActivities,
  getAuditLogs,
  getMetrics,
  getStats,
  getUsers,
  getVerifications,
  getVolunteers,
  deleteUser,
  moderateEntity
} from "../controllers/adminController.js";
import { verifyAdminToken } from "../middleware/adminAuth.js";

const router = Router();

router.use(verifyAdminToken);
router.get("/stats", getStats);
router.get("/metrics", getMetrics);
router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.get("/verifications", getVerifications);
router.get("/activities", getActivities);
router.get("/volunteers-database", getVolunteers);
router.get("/audit-logs", getAuditLogs);
router.patch("/verify/:id", moderateEntity);

export default router;
