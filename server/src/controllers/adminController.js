import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import AdminLog from "../models/AdminLog.js";
import AuditLog from "../models/AuditLog.js";
import Organization from "../models/Organization.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import VolunteerLog from "../models/VolunteerLog.js";

const activeRegistrationStatuses = ["pending", "approved"];

function parsePage(value, fallback = 1) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseLimit(value, fallback = 25) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function invalidQuery(res) {
  return res.status(400).json({ message: "Parameter halaman, batas, atau filter tidak valid." });
}

export async function getStats(req, res, next) {
  try {
    const [users, verifiedOrganizations, unverifiedOrganizations, activeActivities, registrations] = await Promise.all([
      User.countDocuments(),
      Organization.countDocuments({ verified: true }),
      Organization.countDocuments({ verified: false }),
      Activity.countDocuments({ status: "published" }),
      Registration.countDocuments()
    ]);

    return res.json({ users, verifiedOrganizations, unverifiedOrganizations, activeActivities, registrations });
  } catch (error) {
    return next(error);
  }
}

export async function getMetrics(req, res, next) {
  try {
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setMonth(periodStart.getMonth() - 5);

    const [
      totalUsers,
      activeVolunteers,
      pendingOrganizations,
      pendingActivities,
      activeActivities,
      registrations,
      impactTotals,
      monthlyHours
    ] = await Promise.all([
      User.countDocuments(),
      VolunteerLog.distinct("volunteerId", { attendanceStatus: "Hadir" }),
      Organization.countDocuments({ verified: false, verificationStatus: { $ne: "rejected" } }),
      Activity.countDocuments({ verificationStatus: "pending" }),
      Activity.countDocuments({ status: "published" }),
      Registration.countDocuments(),
      VolunteerLog.aggregate([
        { $match: { attendanceStatus: "Hadir" } },
        { $group: { _id: null, totalHours: { $sum: "$hoursLogged" } } }
      ]),
      VolunteerLog.aggregate([
        { $match: { attendanceStatus: "Hadir", updatedAt: { $gte: periodStart } } },
        {
          $group: {
            _id: { year: { $year: "$updatedAt" }, month: { $month: "$updatedAt" } },
            hours: { $sum: "$hoursLogged" }
          }
        }
      ])
    ]);

    const monthlyImpact = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(periodStart.getFullYear(), periodStart.getMonth() + index, 1);
      const match = monthlyHours.find((entry) =>
        entry._id.year === monthDate.getFullYear() && entry._id.month === monthDate.getMonth() + 1
      );
      return {
        month: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(monthDate),
        hours: match?.hours || 0
      };
    });

    return res.json({
      totalUsers,
      activeVolunteers: activeVolunteers.length,
      pendingVerifications: pendingOrganizations + pendingActivities,
      pendingOrganizations,
      pendingActivities,
      totalImpactHours: impactTotals[0]?.totalHours || 0,
      activeActivities,
      registrations,
      monthlyImpact
    });
  } catch (error) {
    return next(error);
  }
}

export async function getVerifications(req, res, next) {
  try {
    const [organizations, activities] = await Promise.all([
      Organization.find({ verified: false, verificationStatus: { $ne: "rejected" } })
        .populate("owner", "name email").sort({ createdAt: 1 }).limit(100).lean(),
      Activity.find({ verificationStatus: "pending" })
        .populate("organization", "name").sort({ createdAt: 1 }).limit(100).lean()
    ]);
    return res.json({ organizations, activities });
  } catch (error) {
    return next(error);
  }
}

export async function getActivities(req, res, next) {
  try {
    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit);
    if (!page || !limit) return invalidQuery(res);

    const filter = {};
    if (req.query.status !== undefined) {
      const status = String(req.query.status);
      if (!["draft", "published", "cancelled"].includes(status)) return invalidQuery(res);
      filter.status = status;
    }
    if (req.query.search !== undefined) {
      const search = String(req.query.search).trim().slice(0, 100);
      if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ title: pattern }, { category: pattern }, { location: pattern }];
      }
    }

    const [activities, total] = await Promise.all([
      Activity.find(filter).populate("organization", "name")
        .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Activity.countDocuments(filter)
    ]);
    return res.json({
      activities,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return next(error);
  }
}

export async function moderateEntity(req, res, next) {
  const { id } = req.params;
  const body = req.body;
  const { entityType, decision } = body || {};
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "ID tidak valid." });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).length !== 2 ||
      !["organization", "activity"].includes(entityType) ||
      !["approved", "rejected"].includes(decision)) {
    return res.status(400).json({ message: "Jenis data atau keputusan moderasi tidak valid." });
  }

  const Model = entityType === "organization" ? Organization : Activity;
  const targetModel = entityType === "organization" ? "Organization" : "Activity";
  const action = `${entityType}.${decision}`;
  let session;
  try {
    session = await mongoose.startSession();
    let entity;
    await session.withTransaction(async () => {
      entity = await Model.findById(id).session(session);
      if (!entity) return;
      if (entityType === "activity" && entity.status === "cancelled" && decision === "approved") {
        const conflict = new Error("Kegiatan yang sudah dibatalkan tidak dapat disetujui kembali.");
        conflict.statusCode = 409;
        throw conflict;
      }

      const previousStatus = entity.verificationStatus ||
        (entityType === "organization"
          ? (entity.verified ? "approved" : "pending")
          : (entity.isVerified ? "approved" : "pending"));
      if (entityType === "organization") {
        entity.verificationStatus = decision === "approved" ? "verified" : "rejected";
        entity.verified = decision === "approved";
        entity.verifiedAt = decision === "approved" ? new Date() : null;
      } else {
        entity.verificationStatus = decision;
        entity.isVerified = decision === "approved";
        if (decision === "rejected") entity.status = "cancelled";
      }
      await entity.save({ session });

      await AdminLog.create([{
        actorId: req.user._id,
        action,
        targetModel,
        targetId: entity._id,
        details: {
          name: entity.name || entity.title,
          previousStatus,
          verificationStatus: decision
        }
      }], { session });
    });

    if (!entity) return res.status(404).json({ message: "Data yang akan dimoderasi tidak ditemukan." });
    return res.json({ entity, entityType });
  } catch (error) {
    return next(error);
  } finally {
    if (session) await session.endSession();
  }
}

export async function getVolunteers(req, res, next) {
  try {
    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit, 20);
    if (!page || !limit) return invalidQuery(res);
    const sortFields = {
      name: "name",
      totalHours: "totalHours",
      createdAt: "createdAt",
      lastActivity: "lastActivity"
    };
    const sortBy = req.query.sortBy === undefined ? "createdAt" : String(req.query.sortBy);
    const sortOrder = req.query.sortOrder === undefined ? "desc" : String(req.query.sortOrder);
    if (!sortFields[sortBy] || !["asc", "desc"].includes(sortOrder)) return invalidQuery(res);

    const match = { role: "volunteer" };
    if (req.query.city !== undefined && String(req.query.city).trim()) {
      match.city = String(req.query.city).trim().slice(0, 100);
    }
    if (req.query.search !== undefined) {
      const search = String(req.query.search).trim().slice(0, 100);
      if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        match.$or = [{ name: pattern }, { email: pattern }, { city: pattern }];
      }
    }
    if (req.query.activityStatus !== undefined && !["active", "inactive"].includes(String(req.query.activityStatus))) {
      return invalidQuery(res);
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "registrations",
          localField: "_id",
          foreignField: "volunteer",
          as: "registrationRecords"
        }
      },
      {
        $addFields: {
          activeRegistrationCount: {
            $size: {
              $filter: {
                input: "$registrationRecords",
                as: "registration",
                cond: { $in: ["$$registration.status", activeRegistrationStatuses] }
              }
            }
          },
          lastActivity: { $max: "$registrationRecords.createdAt" }
        }
      },
      {
        $lookup: {
          from: "volunteerlogs",
          let: { volunteerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$volunteerId", "$$volunteerId"] },
                    { $eq: ["$attendanceStatus", "Hadir"] }
                  ]
                }
              }
            },
            { $group: { _id: null, totalHours: { $sum: "$hoursLogged" } } }
          ],
          as: "impact"
        }
      },
      {
        $addFields: {
          totalHours: {
            $ifNull: [{ $arrayElemAt: ["$impact.totalHours", 0] }, { $ifNull: ["$stats.totalHours", 0] }]
          },
          activityStatus: { $cond: [{ $gt: ["$activeRegistrationCount", 0] }, "active", "inactive"] }
        }
      }
    ];

    if (req.query.activityStatus) {
      pipeline.push({ $match: { activityStatus: String(req.query.activityStatus) } });
    }
    pipeline.push({
      $facet: {
        volunteers: [
          { $sort: { [sortFields[sortBy]]: sortOrder === "asc" ? 1 : -1, _id: 1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              name: 1,
              email: 1,
              phone: 1,
              city: 1,
              interests: 1,
              createdAt: 1,
              totalHours: 1,
              activityStatus: 1,
              activeRegistrationCount: 1,
              lastActivity: 1
            }
          }
        ],
        metadata: [{ $count: "total" }]
      }
    });

    const [result] = await User.aggregate(pipeline).collation({ locale: "id", strength: 2 });
    const volunteers = result?.volunteers || [];
    const total = result?.metadata?.[0]?.total || 0;
    return res.json({
      volunteers,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const page = parsePage(req.query.page);
    const limit = parseLimit(req.query.limit);
    if (!page || !limit) return invalidQuery(res);

    const offset = (page - 1) * limit;
    if (!Number.isSafeInteger(offset)) return invalidQuery(res);
    const [legacyTotal, adminTotal] = await Promise.all([
      AuditLog.countDocuments(),
      AdminLog.countDocuments()
    ]);
    const total = legacyTotal + adminTotal;
    if (offset >= total) {
      return res.json({ auditLogs: [], pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
    }

    const end = Math.min(offset + limit, total);
    const [legacyLogs, adminLogs] = await Promise.all([
      AuditLog.find().populate("actorId", "name email").sort({ timestamp: -1, _id: -1 }).limit(end).lean(),
      AdminLog.find().populate("actorId", "name email").sort({ timestamp: -1, _id: -1 }).limit(end).lean()
    ]);
    const auditLogs = [...legacyLogs, ...adminLogs]
      .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp) ||
        String(right._id).localeCompare(String(left._id)))
      .slice(offset, end);
    return res.json({ auditLogs, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return next(error);
  }
}
