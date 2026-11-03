import { Router } from "express";
import Activity from "../models/Activity.js";
import AuditLog from "../models/AuditLog.js";
import Organization from "../models/Organization.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/stats", async (req, res, next) => {
  try {
    const [users, verifiedOrganizations, unverifiedOrganizations, activeActivities, registrations] = await Promise.all([
      User.countDocuments(),
      Organization.countDocuments({ verified: true }),
      Organization.countDocuments({ verified: false }),
      Activity.countDocuments({ status: "published" }),
      Registration.countDocuments()
    ]);

    return res.json({
      users,
      verifiedOrganizations,
      unverifiedOrganizations,
      activeActivities,
      registrations
    });
  } catch (error) {
    return next(error);
  }
});

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
