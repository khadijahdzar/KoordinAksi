import { Router } from "express";
import {
  createFeedPost,
  getActions,
  getFeed,
  getProfile,
  updateProfile
} from "../controllers/volunteerController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { volunteerPostSchema, volunteerProfileUpdateSchema } from "../validation/requestSchemas.js";

const router = Router();
router.use(protect, authorize("volunteer"));

router.get("/profile/me", getProfile);
router.put("/profile/me", validate(volunteerProfileUpdateSchema), updateProfile);
router.get("/actions", getActions);
router.get("/feed", getFeed);
router.post("/feed", validate(volunteerPostSchema), createFeedPost);

export default router;