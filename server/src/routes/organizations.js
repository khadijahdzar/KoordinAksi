import { Router } from "express";
import mongoose from "mongoose";
import Organization from "../models/Organization.js";
import AuditLog from "../models/AuditLog.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const organizations = await Organization.find({ verified: true })
      .select("name description address verified createdAt").sort({ name: 1 });
    return res.json({ organizations });
  } catch (error) {
    return next(error);
  }
});

router.get("/pending", protect, authorize("admin"), async (req, res, next) => {
  try {
    const organizations = await Organization.find({
      verified: false,
      verificationStatus: { $ne: "rejected" }
    }).populate("owner", "name email");
    return res.json({ organizations });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/verify", protect, authorize("admin"), async (req, res, next) => {
  let session;
  try {
    if (typeof req.body.verified !== "boolean") {
      return res.status(400).json({ message: "Nilai verified harus berupa boolean." });
    }
    session = await mongoose.startSession();
    let organization;
    await session.withTransaction(async () => {
      organization = await Organization.findById(req.params.id).session(session);
      if (!organization) return;

      const previousVerified = organization.verified;
      const previousStatus = organization.verificationStatus || (previousVerified ? "verified" : "pending");
      const verificationStatus = req.body.verified ? "verified" : "rejected";
      if (previousStatus !== verificationStatus || previousVerified !== req.body.verified) {
        organization.verified = req.body.verified;
        organization.verificationStatus = verificationStatus;
        organization.verifiedAt = req.body.verified ? new Date() : null;
        await organization.save({ session });
      }

      await AuditLog.create([{
        actorId: req.user._id,
        action: req.body.verified ? "organization.verified" : "organization.rejected",
        targetModel: "Organization",
        targetId: organization._id,
        details: {
          organizationName: organization.name,
          previousVerified,
          verified: req.body.verified,
          previousStatus,
          verificationStatus
        }
      }], { session });
    });
    if (!organization) return res.status(404).json({ message: "Organisasi tidak ditemukan." });
    return res.json({ organization });
  } catch (error) {
    return next(error);
  } finally {
    if (session) await session.endSession();
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const organization = await Organization.findOne({ _id: req.params.id, verified: true })
      .select("name description address verified createdAt");
    if (!organization) return res.status(404).json({ message: "Organisasi tidak ditemukan." });
    return res.json({ organization });
  } catch (error) {
    return next(error);
  }
});

export default router;
