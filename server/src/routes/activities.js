import { Router } from "express";
import Activity, { ACTIVITY_CATEGORIES } from "../models/Activity.js";
import Registration from "../models/Registration.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

async function getOwnedActivity(req, res) {
  const activity = await Activity.findById(req.params.id);
  if (!activity) {
    res.status(404).json({ message: "Kegiatan tidak ditemukan." });
    return null;
  }
  if (req.user.role !== "admin" && String(activity.organization) !== String(req.user.organization)) {
    res.status(403).json({ message: "Anda tidak dapat mengelola kegiatan ini." });
    return null;
  }
  return activity;
}

router.get("/meta", (req, res) => res.json({ categories: ACTIVITY_CATEGORIES }));

router.get("/", async (req, res, next) => {
  try {
    const { search, category, location, limit = 50, page = 1 } = req.query;
    const filter = { status: "published" };
    if (category && ACTIVITY_CATEGORIES.includes(category)) filter.category = category;
    if (location) {
      const escapedLocation = String(location).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.location = { $regex: escapedLocation, $options: "i" };
    }
    if (search) filter.$text = { $search: String(search) };
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const [activities, total] = await Promise.all([
      Activity.find(filter).populate("organization", "name verified").sort({ date: 1 })
        .skip((safePage - 1) * safeLimit).limit(safeLimit),
      Activity.countDocuments(filter)
    ]);
    return res.json({ activities, pagination: { total, page: safePage, pages: Math.ceil(total / safeLimit) } });
  } catch (error) {
    return next(error);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    const [activities, organizations, volunteers, registrations] = await Promise.all([
      Activity.countDocuments({ status: "published" }),
      Organization.countDocuments({ verified: true }),
      User.countDocuments({ role: "volunteer" }),
      Registration.countDocuments()
    ]);
    return res.json({ activities, organizations, volunteers, registrations });
  } catch (error) {
    return next(error);
  }
});

router.get("/mine", protect, authorize("organization", "admin"), async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} : { organization: req.user.organization };
    const activities = await Activity.find(filter).populate("organization", "name verified").sort({ createdAt: -1 });
    return res.json({ activities });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const activity = await Activity.findOne({ _id: req.params.id, status: "published" })
      .populate("organization", "name description verified address");
    if (!activity) return res.status(404).json({ message: "Kegiatan tidak ditemukan." });
    return res.json({ activity });
  } catch (error) {
    return next(error);
  }
});

router.post("/", protect, authorize("organization", "admin"), async (req, res, next) => {
  try {
    if (!req.user.organization) {
      return res.status(400).json({ message: "Akun ini belum memiliki profil organisasi." });
    }
    const activity = await Activity.create({ ...req.body, organization: req.user.organization });
    return res.status(201).json({ activity });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", protect, authorize("organization", "admin"), async (req, res, next) => {
  try {
    const activity = await getOwnedActivity(req, res);
    if (!activity) return;
    const allowed = ["title", "description", "category", "location", "date", "endDate", "capacity", "imageUrl", "status"];
    for (const key of allowed) if (req.body[key] !== undefined) activity[key] = req.body[key];
    await activity.save();
    return res.json({ activity });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", protect, authorize("organization", "admin"), async (req, res, next) => {
  try {
    const activity = await getOwnedActivity(req, res);
    if (!activity) return;
    activity.status = "cancelled";
    await activity.save();
    return res.json({ message: "Kegiatan dibatalkan." });
  } catch (error) {
    return next(error);
  }
});

export default router;
