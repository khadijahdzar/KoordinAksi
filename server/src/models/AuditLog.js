import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: {
    type: String,
    enum: ["organization.verified", "organization.rejected"],
    required: true
  },
  targetModel: { type: String, enum: ["Organization"], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, required: true }
}, { versionKey: false });

auditLogSchema.index({ timestamp: -1, _id: -1 });
auditLogSchema.index({ targetModel: 1, targetId: 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
