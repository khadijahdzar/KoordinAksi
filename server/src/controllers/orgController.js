import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Organization from "../models/Organization.js";
import OrganizationAction from "../models/OrganizationAction.js";
import Registration from "../models/Registration.js";
import VolunteerLog from "../models/VolunteerLog.js";

const countedRegistrationStatuses = ["pending", "approved", "attended"];

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getOrganizationId(req) {
  if (!req.user.organization) throw createHttpError(400, "Akun ini belum memiliki profil organisasi.");
  return req.user.organization;
}

export async function listOrganizations(req, res, next) {
  try {
    const filter = { verified: true };
    if (req.query.category) filter.focusCategory = String(req.query.category).trim();
    if (req.query.search) {
      const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
      filter.$or = [{ name: search }, { description: search }, { focusCategory: search }, { address: search }];
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 100);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const [organizations, total] = await Promise.all([
      Organization.find(filter).select("name description focusCategory logoUrl address verified createdAt")
        .sort({ name: 1 }).skip((page - 1) * limit).limit(limit),
      Organization.countDocuments(filter)
    ]);
    return res.json({ organizations, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return next(error);
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    const organizationId = getOrganizationId(req);
    const actions = await Activity.find({ organization: organizationId }).select("_id status date").lean();
    const actionIds = actions.map((action) => action._id);
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setMonth(periodStart.getMonth() - 5);

    const [volunteerIds, logs, hoursResult] = await Promise.all([
      Registration.distinct("volunteer", {
        activity: { $in: actionIds },
        status: { $in: countedRegistrationStatuses }
      }),
      VolunteerLog.find({
        actionId: { $in: actionIds },
        attendanceStatus: "Hadir",
        updatedAt: { $gte: periodStart }
      }).select("hoursLogged updatedAt").lean(),
      VolunteerLog.aggregate([
        { $match: { actionId: { $in: actionIds }, attendanceStatus: "Hadir" } },
        { $group: { _id: null, totalHours: { $sum: "$hoursLogged" } } }
      ])
    ]);

    const monthlyImpact = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(periodStart.getFullYear(), periodStart.getMonth() + index, 1);
      const entries = logs.filter((log) => {
        const loggedAt = new Date(log.updatedAt);
        return loggedAt.getFullYear() === date.getFullYear() && loggedAt.getMonth() === date.getMonth();
      });
      return {
        month: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date),
        hours: entries.reduce((sum, entry) => sum + entry.hoursLogged, 0),
        volunteers: entries.length
      };
    });
    const currentHours = monthlyImpact.at(-1)?.hours || 0;
    const previousHours = monthlyImpact.at(-2)?.hours || 0;
    const impactGrowth = previousHours
      ? Math.round(((currentHours - previousHours) / previousHours) * 100)
      : currentHours ? 100 : 0;
    const totalHours = hoursResult[0]?.totalHours || 0;

    return res.json({
      stats: {
        totalActivities: actions.filter((action) => action.status !== "cancelled").length,
        activeActionsCount: actions.filter((action) => action.status === "published" && action.date >= new Date()).length,
        totalVolunteers: volunteerIds.length,
        totalHours,
        impactScore: Math.round(totalHours + volunteerIds.length),
        impactGrowth,
        monthlyImpact
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function createAction(req, res, next) {
  try {
    const organizationId = getOrganizationId(req);
    const organization = await Organization.findById(organizationId).select("verified");
    if (!organization) return res.status(404).json({ message: "Profil organisasi tidak ditemukan." });
    if (!organization.verified) return res.status(403).json({ message: "Organisasi harus terverifikasi untuk membuat kegiatan." });
    const action = await OrganizationAction.create({ ...req.body, organization: organizationId });
    return res.status(201).json({ action });
  } catch (error) {
    return next(error);
  }
}

export async function getVolunteerDatabase(req, res, next) {
  try {
    const organizationId = getOrganizationId(req);
    const actions = await Activity.find({ organization: organizationId }).select("_id title date location").lean();
    const actionById = new Map(actions.map((action) => [String(action._id), action]));
    const actionIds = actions.map((action) => action._id);
    const registrations = await Registration.find({
      activity: { $in: actionIds },
      status: { $in: countedRegistrationStatuses }
    }).populate("volunteer", "name email phone city").sort({ createdAt: -1 }).lean();
    const logs = await VolunteerLog.find({ actionId: { $in: actionIds } }).lean();
    const logByPair = new Map(logs.map((log) => [`${log.actionId}:${log.volunteerId}`, log]));
    const volunteers = registrations.map((registration) => {
      const log = logByPair.get(`${registration.activity}:${registration.volunteer?._id}`);
      return {
        _id: registration._id,
        volunteer: registration.volunteer,
        activity: actionById.get(String(registration.activity)),
        registrationStatus: registration.status,
        attendanceStatus: log?.attendanceStatus || "Belum dicatat",
        hoursLogged: log?.hoursLogged || 0
      };
    });
    return res.json({ volunteers });
  } catch (error) {
    return next(error);
  }
}

export async function logAttendance(req, res, next) {
  let session;
  try {
    if (!mongoose.isValidObjectId(req.params.actionId)) {
      return res.status(400).json({ message: "ID kegiatan tidak valid." });
    }
    const organizationId = getOrganizationId(req);
    session = await mongoose.startSession();
    let attendance;
    await session.withTransaction(async () => {
      const action = await Activity.findOne({ _id: req.params.actionId, organization: organizationId }).session(session);
      if (!action) throw createHttpError(404, "Kegiatan tidak ditemukan untuk organisasi ini.");
      const registration = await Registration.findOne({
        activity: action._id,
        volunteer: req.body.volunteerId,
        status: { $in: countedRegistrationStatuses }
      }).session(session);
      if (!registration) throw createHttpError(404, "Pendaftaran relawan untuk kegiatan ini tidak ditemukan.");
      if (registration.status === "pending") throw createHttpError(409, "Terima pendaftaran relawan sebelum mencatat kehadiran.");

      attendance = await VolunteerLog.findOneAndUpdate({
        actionId: action._id,
        volunteerId: req.body.volunteerId
      }, {
        $set: {
          attendanceStatus: req.body.attendanceStatus,
          hoursLogged: req.body.attendanceStatus === "Hadir" ? req.body.hoursLogged : 0
        }
      }, { new: true, upsert: true, runValidators: true, session });

      if (req.body.attendanceStatus === "Hadir" && registration.status === "approved") {
        registration.status = "attended";
        registration.reviewedAt = new Date();
        await registration.save({ session });
      } else if (req.body.attendanceStatus === "Alpha" && registration.status === "attended") {
        registration.status = "approved";
        registration.reviewedAt = new Date();
        await registration.save({ session });
      }
    });
    return res.json({ attendance });
  } catch (error) {
    return next(error);
  } finally {
    if (session) await session.endSession();
  }
}