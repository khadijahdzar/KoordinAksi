import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true, trim: true, maxlength: 100 },
  targetModel: { type: String, enum: ["Organization", "Activity"], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, required: true }
}, { versionKey: false });

adminLogSchema.index({ timestamp: -1, _id: -1 });
adminLogSchema.index({ targetModel: 1, targetId: 1, timestamp: -1 });

export default mongoose.model("AdminLog", adminLogSchema);
