import { Router } from "express";
import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Organization from "../models/Organization.js";
import AuditLog from "../models/AuditLog.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

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
    if (scale === "local") filter["stats.totalVolunteers"] = { $lt: 50 };
    if (scale === "growing") filter["stats.totalVolunteers"] = { $gte: 50, $lt: 200 };
    if (scale === "national") filter["stats.totalVolunteers"] = { $gte: 200 };
    if (legalRegistered === "true") filter.legalNumber = { $exists: true, $ne: "" };

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 50);
    const safePage = Math.max(Number(page) || 1, 1);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const verifiedOrganizationIds = await Organization.distinct("_id", { verified: true });
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
        date: { $lt: now }
      }),
      Activity.aggregate([
        { $match: { organization: { $in: verifiedOrganizationIds }, status: "published", date: { $gte: monthStart, $lt: now } } },
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

    const organizationIds = organizations.map((organization) => organization._id);
    const completedByOrganization = organizationIds.length
      ? await Activity.aggregate([
        { $match: { organization: { $in: organizationIds }, status: "published", date: { $lt: now } } },
        { $group: { _id: "$organization", count: { $sum: 1 } } }
      ])
      : [];
    const completedCounts = new Map(completedByOrganization.map((item) => [String(item._id), item.count]));
    const enrichedOrganizations = organizations.map((organization) => ({
      ...organization,
      stats: {
        ...organization.stats,
        completedActions: completedCounts.get(String(organization._id)) || 0
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
    const organization = await Organization.findOne({ _id: req.params.id, verified: true })
      .select("name description address verified createdAt");
    if (!organization) return res.status(404).json({ message: "Organisasi tidak ditemukan." });
    return res.json({ organization });
  } catch (error) {
    return next(error);
  }
});

export default router;
