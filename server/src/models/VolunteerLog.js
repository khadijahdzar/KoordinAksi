import mongoose from "mongoose";

const volunteerLogSchema = new mongoose.Schema({
  actionId: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", required: true },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  attendanceStatus: { type: String, enum: ["Hadir", "Alpha"], required: true },
  hoursLogged: { type: Number, min: 0, max: 24, default: 0 }
}, { timestamps: true });

volunteerLogSchema.index({ actionId: 1, volunteerId: 1 }, { unique: true });
volunteerLogSchema.index({ createdAt: -1 });

export default mongoose.model("VolunteerLog", volunteerLogSchema);