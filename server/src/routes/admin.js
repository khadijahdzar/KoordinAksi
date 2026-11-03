import { Router } from "express";
import AuditLog from "../models/AuditLog.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/audit-logs", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 25, 1), 100);
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const [auditLogs, total] = await Promise.all([
      AuditLog.find()
        .populate("actorId", "name email")
        .sort({ timestamp: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      AuditLog.countDocuments()
    ]);

    return res.json({
      auditLogs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
