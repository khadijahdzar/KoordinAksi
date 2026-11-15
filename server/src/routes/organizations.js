import { Router } from "express";
import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Organization from "../models/Organization.js";
import AuditLog from "../models/AuditLog.js";
import Registration from "../models/Registration.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();
const countedRegistrationStatuses = ["pending", "approved", "attended"];

async function getOrganizationMetrics(organizationIds, now) {
  const metrics = new Map(organizationIds.map((id) => [String(id), {
    activeActionsCount: 0,
    completedActions: 0,
    totalVolunteers: 0
  }]));
  if (!organizationIds.length) return metrics;

  const [activityIds, activityMetrics] = await Promise.all([
    Activity.distinct("_id", {
      organization: { $in: organizationIds },
      status: "published",
      verificationStatus: { $nin: ["pending", "rejected"] }
    }),
    Activity.aggregate([
      {
        $match: {
          organization: { $in: organizationIds },
          status: "published",
          verificationStatus: { $nin: ["pending", "rejected"] }
        }
      },
      {
        $group: {
          _id: "$organization",
          activeActionsCount: {
            $sum: { $cond: [{ $gte: ["$date", now] }, 1, 0] }
          },
          completedActions: {
            $sum: { $cond: [{ $lt: ["$date", now] }, 1, 0] }
          }
        }
      }
    ])
  ]);
  for (const activityMetric of activityMetrics) {
    Object.assign(metrics.get(String(activityMetric._id)), {
      activeActionsCount: activityMetric.activeActionsCount,
      completedActions: activityMetric.completedActions
    });
  }

  if (activityIds.length) {
    const volunteerMetrics = await Registration.aggregate([
      {
        $match: {
          activity: { $in: activityIds },
          status: { $in: countedRegistrationStatuses }
        }
      },
      {
        $lookup: {
          from: Activity.collection.name,
          localField: "activity",
          foreignField: "_id",
          as: "activity"
        }
      },
      { $unwind: "$activity" },
      {
        $group: {
          _id: "$activity.organization",
          volunteers: { $addToSet: "$volunteer" }
        }
      },
      {
        $project: {
          totalVolunteers: { $size: "$volunteers" }
        }
      }
    ]);
    for (const volunteerMetric of volunteerMetrics) {
      const organizationMetrics = metrics.get(String(volunteerMetric._id));
      if (organizationMetrics) organizationMetrics.totalVolunteers = volunteerMetric.totalVolunteers;
    }
  }

  return metrics;
}

function isWithinScale(scale, totalVolunteers) {
  if (scale === "local") return totalVolunteers < 50;
  if (scale === "growing") return totalVolunteers >= 50 && totalVolunteers < 200;
  if (scale === "national") return totalVolunteers >= 200;
  return true;
}

router.get("/", async (req, res, next) => {
  try {
    const {
      search = "",
      focus = "",
      region = "",
      scale = "",
      legalRegistered = "",
      page = 1,
      limit = 50
    } = req.query;
    const filter = { verified: true };
    const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: pattern }, { description: pattern }, { address: pattern }, { focusCategory: pattern }];
    }
    if (focus) filter.focusCategory = focus;
    if (region) filter.address = new RegExp(escapeRegex(region), "i");
    if (legalRegistered === "true") filter.legalNumber = { $exists: true, $ne: "" };

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 50);
    const safePage = Math.max(Number(page) || 1, 1);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const verifiedOrganizationIds = await Organization.distinct("_id", { verified: true });
    const scaleMetrics = ["local", "growing", "national"].includes(scale)
      ? await getOrganizationMetrics(verifiedOrganizationIds, now)
      : null;
    if (scaleMetrics) {
      filter._id = {
        $in: verifiedOrganizationIds.filter((id) =>
          isWithinScale(scale, scaleMetrics.get(String(id))?.totalVolunteers || 0)
        )
      };
    }
    const [organizations, total, verifiedOrganizations, legalRecords, completedActions, monthlyActivityCounts] = await Promise.all([
      Organization.find(filter)
        .select("name description focusCategory logoUrl address verified createdAt stats")
        .sort({ "stats.impactScore": -1, name: 1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      Organization.countDocuments(filter),
      Organization.countDocuments({ verified: true }),
      Organization.countDocuments({ verified: true, legalNumber: { $exists: true, $ne: "" } }),
      Activity.countDocuments({
        organization: { $in: verifiedOrganizationIds },
        status: "published",
        verificationStatus: { $nin: ["pending", "rejected"] },
        date: { $lt: now }
      }),
      Activity.aggregate([
        {
          $match: {
            organization: { $in: verifiedOrganizationIds },
            status: "published",
            verificationStatus: { $nin: ["pending", "rejected"] },
            date: { $gte: monthStart, $lt: now }
          }
        },
        { $group: { _id: "$organization", score: { $sum: 1 } } },
        { $sort: { score: -1, _id: 1 } },
        { $limit: 5 }
      ])
    ]);
    const leaderboardOrganizations = monthlyActivityCounts.length
      ? await Organization.find({ _id: { $in: monthlyActivityCounts.map((entry) => entry._id) }, verified: true })
        .select("name")
        .lean()
      : [];
    const organizationNames = new Map(leaderboardOrganizations.map((organization) =>
      [String(organization._id), organization.name]
    ));
    const leaderboard = monthlyActivityCounts.map((entry) => ({
      _id: entry._id,
      name: organizationNames.get(String(entry._id)),
      score: entry.score
    })).filter((entry) => entry.name);

    const organizationMetrics = scaleMetrics || await getOrganizationMetrics(
      organizations.map((organization) => organization._id),
      now
    );
    const enrichedOrganizations = organizations.map((organization) => ({
      ...organization,
      stats: {
        ...organization.stats,
        ...(organizationMetrics.get(String(organization._id)) || {})
      }
    }));

    return res.json({
      organizations: enrichedOrganizations,
      pagination: { total, page: safePage, pages: Math.ceil(total / safeLimit) },
      summary: { verifiedOrganizations, legalRecords, completedActions },
      leaderboard
    });
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
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID organisasi tidak valid." });
    }
    const organization = await Organization.findOne({ _id: req.params.id, verified: true })
      .select("name description focusCategory logoUrl address verified createdAt stats")
      .lean();
    if (!organization) return res.status(404).json({ message: "Organisasi tidak ditemukan." });

    const activityFilter = {
      organization: organization._id,
      status: "published",
      verificationStatus: { $nin: ["pending", "rejected"] }
    };
    const [activities, galleryActivities] = await Promise.all([
      Activity.find(activityFilter).select("_id date").lean(),
      Activity.find({ ...activityFilter, imageUrl: { $exists: true, $ne: "" } })
        .select("imageUrl").sort({ date: -1 }).limit(6).lean()
    ]);
    const volunteerIds = activities.length
      ? await Registration.distinct("volunteer", {
        status: { $in: countedRegistrationStatuses },
        activity: { $in: activities.map((activity) => activity._id) }
      })
      : [];
    const now = new Date();
    const profile = {
      ...organization,
      stats: {
        ...organization.stats,
        activeActionsCount: activities.filter((activity) => activity.date >= now).length,
        completedActions: activities.filter((activity) => activity.date < now).length,
        totalVolunteers: volunteerIds.length
      },
      gallery: galleryActivities.map((activity) => activity.imageUrl)
    };
    return res.json({ organization: profile });
  } catch (error) {
    return next(error);
  }
});

export default router;
