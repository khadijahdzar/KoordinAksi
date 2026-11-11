import Registration from "../models/Registration.js";
import Volunteer from "../models/Volunteer.js";
import VolunteerLog from "../models/VolunteerLog.js";
import VolunteerPost from "../models/VolunteerPost.js";

const joinedStatuses = ["approved", "attended"];

export async function getProfile(req, res, next) {
  try {
    const [volunteer, registrations, attendanceStats] = await Promise.all([
      Volunteer.findById(req.user.id).select("-password"),
      Registration.find({ volunteer: req.user.id, status: { $in: joinedStatuses } })
        .populate("activity", "title date endDate category location imageUrl"),
      VolunteerLog.aggregate([
        { $match: { volunteerId: req.user._id, attendanceStatus: "Hadir" } },
        {
          $group: {
            _id: null,
              totalHours: { $sum: "$hoursLogged" }
          }
        }
      ])
    ]);
    if (!volunteer) return res.status(404).json({ message: "Profil relawan tidak ditemukan." });

    const totalActions = registrations.filter((registration) => registration.status === "attended").length;
    const totalHours = attendanceStats[0]?.totalHours || 0;

    return res.json({
      profile: {
        ...volunteer.toObject(),
        joinedActions: registrations.map((registration) => registration.activity).filter(Boolean),
        stats: {
          totalActions,
          totalHours: Math.round(totalHours * 10) / 10,
          badgesCount: volunteer.stats?.badgesCount || 0
        }
      }
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const volunteer = await Volunteer.findOneAndUpdate(
      { _id: req.user.id, role: "volunteer" },
      { $set: req.body },
      { new: true, runValidators: true }
    ).select("-password");
    if (!volunteer) return res.status(404).json({ message: "Profil relawan tidak ditemukan." });
    return res.json({ profile: volunteer });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Username sudah digunakan." });
    return next(error);
  }
}

export async function getActions(req, res, next) {
  try {
    const registrations = await Registration.find({
      volunteer: req.user.id,
      status: { $in: joinedStatuses }
    }).populate({ path: "activity", populate: { path: "organization", select: "name" } }).sort({ createdAt: -1 });
    return res.json({ actions: registrations });
  } catch (error) {
    return next(error);
  }
}

export async function getFeed(req, res, next) {
  try {
    const posts = await VolunteerPost.find().populate("author", "name username avatarUrl")
      .sort({ createdAt: -1 }).limit(50);
    return res.json({ posts });
  } catch (error) {
    return next(error);
  }
}

export async function createFeedPost(req, res, next) {
  try {
    const [post] = await VolunteerPost.create([{
      ...req.body,
      author: req.user.id
    }]);
    await post.populate("author", "name username avatarUrl");
    return res.status(201).json({ post });
  } catch (error) {
    return next(error);
  }
}