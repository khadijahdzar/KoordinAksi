import { Router } from "express";
import mongoose from "mongoose";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.get("/me/following", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("followedOrganizations").lean();
    return res.json({ organizationIds: (user?.followedOrganizations || []).map(String) });
  } catch (error) {
    return next(error);
  }
});

router.post("/:id/follow", protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID organisasi tidak valid." });
    }
    const organization = await Organization.findOne({ _id: req.params.id, verified: true }).select("_id");
    if (!organization) return res.status(404).json({ message: "Organisasi tidak ditemukan." });

    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { followedOrganizations: organization._id } }
    );
    return res.json({ followed: true, organizationId: String(organization._id) });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id/follow", protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID organisasi tidak valid." });
    }
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { followedOrganizations: req.params.id } }
    );
    return res.json({ followed: false, organizationId: String(req.params.id) });
  } catch (error) {
    return next(error);
  }
});

export default router;
