import { Router } from "express";
import Organization from "../models/Organization.js";
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
    const organizations = await Organization.find({ verified: false }).populate("owner", "name email");
    return res.json({ organizations });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/verify", protect, authorize("admin"), async (req, res, next) => {
  try {
    if (typeof req.body.verified !== "boolean") {
      return res.status(400).json({ message: "Nilai verified harus berupa boolean." });
    }
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      { verified: req.body.verified, verifiedAt: req.body.verified ? new Date() : null },
      { new: true, runValidators: true }
    );
    if (!organization) return res.status(404).json({ message: "Organisasi tidak ditemukan." });
    return res.json({ organization });
  } catch (error) {
    return next(error);
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
