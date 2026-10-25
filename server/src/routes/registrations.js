import { Router } from "express";
import Activity from "../models/Activity.js";
import Registration from "../models/Registration.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.post("/", protect, authorize("volunteer"), async (req, res, next) => {
  try {
    const activity = await Activity.findOne({ _id: req.body.activityId, status: "published" });
    if (!activity) return res.status(404).json({ message: "Kegiatan tidak tersedia." });
    if (activity.date <= new Date()) return res.status(400).json({ message: "Pendaftaran kegiatan yang sudah berlangsung ditutup." });
    const activeCount = await Registration.countDocuments({
      activity: activity._id, status: { $in: ["pending", "approved", "attended"] }
    });
    if (activeCount >= activity.capacity) return res.status(409).json({ message: "Kuota kegiatan sudah penuh." });
    const registration = await Registration.create({
      activity: activity._id,
      volunteer: req.user.id,
      note: req.body.note
    });
    return res.status(201).json({ registration });
  } catch (error) {
    return next(error);
  }
});

router.get("/mine", protect, authorize("volunteer"), async (req, res, next) => {
  try {
    const registrations = await Registration.find({ volunteer: req.user.id })
      .populate({ path: "activity", populate: { path: "organization", select: "name" } })
      .sort({ createdAt: -1 });
    return res.json({ registrations });
  } catch (error) {
    return next(error);
  }
});

router.get("/activity/:activityId", protect, authorize("organization", "admin"), async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.activityId);
    if (!activity) return res.status(404).json({ message: "Kegiatan tidak ditemukan." });
    if (req.user.role !== "admin" && String(activity.organization) !== String(req.user.organization)) {
      return res.status(403).json({ message: "Anda tidak dapat melihat pendaftar kegiatan ini." });
    }
    const registrations = await Registration.find({ activity: activity._id })
      .populate("volunteer", "name email phone").sort({ createdAt: -1 });
    return res.json({ registrations });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id/status", protect, authorize("organization", "admin"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected", "attended", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Status pendaftaran tidak valid." });
    }
    const registration = await Registration.findById(req.params.id).populate("activity");
    if (!registration) return res.status(404).json({ message: "Pendaftaran tidak ditemukan." });
    if (req.user.role !== "admin" && String(registration.activity.organization) !== String(req.user.organization)) {
      return res.status(403).json({ message: "Anda tidak dapat mengubah pendaftaran ini." });
    }
    registration.status = status;
    registration.reviewedAt = new Date();
    await registration.save();
    return res.json({ registration });
  } catch (error) {
    return next(error);
  }
});

export default router;
