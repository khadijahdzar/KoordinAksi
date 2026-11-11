import { Router } from "express";
import mongoose from "mongoose";
import Activity, { ACTIVITY_CATEGORIES } from "../models/Activity.js";
import Registration from "../models/Registration.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { activityCreateSchema, activityUpdateSchema } from "../validation/requestSchemas.js";

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
    const { search, category, location, date, organization, limit = 50, page = 1 } = req.query;
    const verifiedOrganizationIds = await Organization.distinct("_id", { verified: true });
    const filter = {
      status: "published",
      verificationStatus: { $nin: ["pending", "rejected"] },
      organization: { $in: verifiedOrganizationIds }
    };
    if (category) {
      const categoryAliases = {
        "Semua Kategori": [],
        "Lingkungan Hidup": ["Penghijauan"],
        "Pendidikan & Anak": ["Pendidikan"],
        "Kesehatan & Lansia": ["Kesehatan", "Donor Darah"],
        "Semua Bencana": ["Bantuan Bencana"],
        "Pemberdayaan UMKM": ["Lainnya"],
        "Kebudayaan": ["Bakti Sosial"]
      };
      const requestedCategories = String(category).split(",").flatMap((value) =>
        categoryAliases[value] || (ACTIVITY_CATEGORIES.includes(value) ? [value] : [])
      );
      if (requestedCategories.length) filter.category = { $in: [...new Set(requestedCategories)] };
    }
    if (location) {
      const escapedLocation = String(location).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.location = { $regex: escapedLocation, $options: "i" };
    }
    if (organization) {
      if (!mongoose.isValidObjectId(organization)) {
        return res.status(400).json({ message: "ID organisasi tidak valid." });
      }
      const organizationId = new mongoose.Types.ObjectId(organization);
      filter.organization = verifiedOrganizationIds.some((id) => id.equals(organizationId))
        ? { $in: [organizationId] }
        : { $in: [] };
    }
    if (search) filter.$text = { $search: String(search) };
    if (date) {
      if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "Format tanggal harus YYYY-MM-DD." });
      }
      const startDate = new Date(`${date}T00:00:00.000Z`);
      if (Number.isNaN(startDate.getTime()) || startDate.toISOString().slice(0, 10) !== date) {
        return res.status(400).json({ message: "Tanggal kegiatan tidak valid." });
      }
      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }
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
      Activity.countDocuments({
        status: "published",
        verificationStatus: { $nin: ["pending", "rejected"] },
        organization: { $in: await Organization.distinct("_id", { verified: true }) }
      }),
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
    const activity = await Activity.findOne({
      _id: req.params.id,
      status: "published",
      verificationStatus: { $nin: ["pending", "rejected"] },
      organization: { $in: await Organization.distinct("_id", { verified: true }) }
    })
      .populate("organization", "name description verified address");
    if (!activity) return res.status(404).json({ message: "Kegiatan tidak ditemukan." });
    return res.json({ activity });
  } catch (error) {
    return next(error);
  }
});

router.post("/", validate(activityCreateSchema), protect, authorize("organization", "admin"), async (req, res, next) => {
  try {
    if (!req.user.organization) {
      return res.status(400).json({ message: "Akun ini belum memiliki profil organisasi." });
    }
    const organization = await Organization.findById(req.user.organization).select("verified");
    if (!organization) {
      return res.status(400).json({ message: "Profil organisasi akun ini tidak ditemukan." });
    }
    if (!organization.verified) {
      return res.status(403).json({ message: "Organisasi Anda belum diverifikasi oleh Admin." });
    }
    const activity = await Activity.create({ ...req.body, organization: organization._id });
    return res.status(201).json({ activity });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", validate(activityUpdateSchema), protect, authorize("organization", "admin"), async (req, res, next) => {
  try {
    const activity = await getOwnedActivity(req, res);
    if (!activity) return;
    if (req.body.status === "published" && ["pending", "rejected"].includes(activity.verificationStatus)) {
      return res.status(403).json({ message: "Kegiatan yang menunggu verifikasi atau ditolak tidak dapat dipublikasikan." });
    }
    if (req.body.status === "published") {
      const organization = await Organization.findById(activity.organization).select("verified");
      if (!organization?.verified) {
        return res.status(403).json({ message: "Organisasi harus terverifikasi untuk mempublikasikan kegiatan." });
      }
    }
    const allowed = ["title", "description", "category", "location", "date", "endDate", "capacity", "imageUrl", "status"];
    const updates = Object.fromEntries(
      allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]])
    );
    const filter = { _id: activity._id };
    if (req.body.capacity !== undefined) {
      filter.$expr = { $lte: ["$activeRegistrations", req.body.capacity] };
    }

    const updatedActivity = await Activity.findOneAndUpdate(filter, { $set: updates }, {
      new: true,
      runValidators: true
    });
    if (updatedActivity) return res.json({ activity: updatedActivity });

    const currentActivity = await Activity.findById(activity._id).select("activeRegistrations");
    if (!currentActivity) return res.status(404).json({ message: "Kegiatan tidak ditemukan." });
    if (req.body.capacity !== undefined && req.body.capacity < currentActivity.activeRegistrations) {
      return res.status(409).json({
        message: `Kapasitas baru (${req.body.capacity}) tidak boleh lebih kecil dari jumlah pendaftar aktif saat ini (${currentActivity.activeRegistrations}).`
      });
    }
    return next(new Error("Kegiatan gagal diperbarui karena data berubah selama proses."));
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
