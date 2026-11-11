import { Router } from "express";
import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Registration from "../models/Registration.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { registrationCreateSchema, registrationStatusSchema } from "../validation/requestSchemas.js";

const router = Router();
const capacityStatuses = ["pending", "approved", "attended"];
const allowedTransitions = {
  pending: ["approved", "rejected", "cancelled"],
  approved: ["attended", "cancelled"],
  rejected: [],
  attended: [],
  cancelled: []
};

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

router.post("/", validate(registrationCreateSchema), protect, authorize("volunteer"), async (req, res, next) => {
  let session;
  try {
    session = await mongoose.startSession();
    let registration;
    await session.withTransaction(async () => {
      const activity = await Activity.findOne({
        _id: req.body.activityId,
        status: "published",
        verificationStatus: { $nin: ["pending", "rejected"] }
      }).session(session);

      if (!activity) {
        throw createHttpError(404, "Kegiatan tidak tersedia.");
      }
      if (activity.date <= new Date()) {
        throw createHttpError(400, "Pendaftaran kegiatan yang sudah berlangsung ditutup.");
      }

      const reservedActivity = await Activity.findOneAndUpdate({
        _id: activity._id,
        status: "published",
        verificationStatus: { $nin: ["pending", "rejected"] },
        date: { $gt: new Date() },
        $expr: { $lt: ["$activeRegistrations", "$capacity"] }
      }, {
        $inc: { activeRegistrations: 1 }
      }, {
        new: true,
        session
      });

      if (!reservedActivity) {
        if (activity.date <= new Date()) {
          throw createHttpError(400, "Pendaftaran kegiatan yang sudah berlangsung ditutup.");
        }
        throw createHttpError(409, "Kuota kegiatan sudah penuh.");
      }

      [registration] = await Registration.create([{
        activity: activity._id,
        volunteer: req.user.id,
        note: req.body.note
      }], { session });
    });

    return res.status(201).json({ registration });
  } catch (error) {
    return next(error);
  } finally {
    if (session) await session.endSession();
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

router.patch("/:id/cancel", protect, authorize("volunteer"), async (req, res, next) => {
  let session;
  try {
    session = await mongoose.startSession();
    let registration;
    await session.withTransaction(async () => {
      const current = await Registration.findById(req.params.id).session(session);
      if (!current) throw createHttpError(404, "Pendaftaran tidak ditemukan.");
      if (String(current.volunteer) !== String(req.user.id)) {
        throw createHttpError(403, "Anda tidak dapat membatalkan pendaftaran ini.");
      }
      if (!["pending", "approved"].includes(current.status)) {
        throw createHttpError(409, `Pendaftaran berstatus "${current.status}" tidak dapat dibatalkan.`);
      }

      registration = await Registration.findOneAndUpdate({
        _id: current._id,
        volunteer: req.user.id,
        status: { $in: ["pending", "approved"] }
      }, {
        $set: { status: "cancelled" }
      }, {
        new: true,
        session
      });

      if (!registration) {
        throw createHttpError(409, "Status pendaftaran berubah. Muat ulang lalu coba lagi.");
      }

      const release = await Activity.updateOne({
        _id: current.activity,
        activeRegistrations: { $gt: 0 }
      }, {
        $inc: { activeRegistrations: -1 }
      }, { session });

      if (release.modifiedCount !== 1) {
        throw new Error(`Kapasitas kegiatan ${current.activity} tidak konsisten dengan pendaftar aktif.`);
      }
    });

    return res.json({ registration });
  } catch (error) {
    return next(error);
  } finally {
    if (session) await session.endSession();
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

router.patch("/:id/status", validate(registrationStatusSchema), protect, authorize("organization", "admin"), async (req, res, next) => {
  let session;
  try {
    session = await mongoose.startSession();
    let registration;
    await session.withTransaction(async () => {
      registration = await Registration.findById(req.params.id).session(session);
      if (!registration) {
        throw createHttpError(404, "Pendaftaran tidak ditemukan.");
      }

      const activity = await Activity.findById(registration.activity).session(session);
      if (!activity) {
        throw createHttpError(404, "Kegiatan tidak ditemukan.");
      }
      if (req.user.role !== "admin" && String(activity.organization) !== String(req.user.organization)) {
        throw createHttpError(403, "Anda tidak dapat mengubah pendaftaran ini.");
      }
      if (!allowedTransitions[registration.status].includes(req.body.status)) {
        throw createHttpError(
          409,
          `Transisi status dari "${registration.status}" ke "${req.body.status}" tidak diizinkan.`
        );
      }

      const wasCounted = capacityStatuses.includes(registration.status);
      const willBeCounted = capacityStatuses.includes(req.body.status);

      if (!wasCounted && willBeCounted) {
        const reservation = await Activity.updateOne({
          _id: activity._id,
          $expr: { $lt: ["$activeRegistrations", "$capacity"] }
        }, {
          $inc: { activeRegistrations: 1 }
        }, { session });

        if (reservation.modifiedCount !== 1) {
          throw createHttpError(409, "Kuota kegiatan sudah penuh.");
        }
      } else if (wasCounted && !willBeCounted) {
        const release = await Activity.updateOne({
          _id: activity._id,
          activeRegistrations: { $gt: 0 }
        }, {
          $inc: { activeRegistrations: -1 }
        }, { session });

        if (release.modifiedCount !== 1) {
          throw new Error(`Kapasitas kegiatan ${activity.id} tidak konsisten dengan pendaftar aktif.`);
        }
      }

      registration.status = req.body.status;
      registration.reviewedAt = new Date();
      await registration.save({ session });
    });

    return res.json({ registration });
  } catch (error) {
    return next(error);
  } finally {
    if (session) await session.endSession();
  }
});

export default router;
