import { Router } from "express";
import {
  createAction,
  getDashboardStats,
  getVolunteerDatabase,
  listOrganizations,
  logAttendance
} from "../controllers/orgController.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { activityCreateSchema, attendanceLogSchema } from "../validation/requestSchemas.js";

const router = Router();

router.get("/", listOrganizations);
router.get("/dashboard/stats", protect, authorize("organization"), getDashboardStats);
router.get("/volunteers/database", protect, authorize("organization"), getVolunteerDatabase);
router.post("/actions", protect, authorize("organization"), validate(activityCreateSchema), createAction);
router.post("/actions/:actionId/attendance", protect, authorize("organization"), validate(attendanceLogSchema), logAttendance);

export default router;