import { Router } from "express";
import User from "../models/User.js";
import VolunteerLog from "../models/VolunteerLog.js";

const router = Router();

router.get("/volunteers", async (req, res, next) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const volunteers = await VolunteerLog.aggregate([
      {
        $match: {
          attendanceStatus: "Hadir",
          hoursLogged: { $gt: 0 },
          updatedAt: { $gte: monthStart, $lte: now }
        }
      },
      {
        $group: {
          _id: "$volunteerId",
          hours: { $sum: "$hoursLogged" },
          actions: { $addToSet: "$actionId" }
        }
      },
      {
        $project: {
          hours: 1,
          actions: { $size: "$actions" }
        }
      },
      { $sort: { hours: -1, actions: -1, _id: 1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: User.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "volunteer"
        }
      },
      { $unwind: "$volunteer" },
      {
        $project: {
          _id: 1,
          name: "$volunteer.name",
          hours: 1,
          actions: 1
        }
      }
    ]);

    return res.json({ volunteers });
  } catch (error) {
    return next(error);
  }
});

export default router;
