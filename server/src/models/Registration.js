import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema({
  activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", required: true },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "attended", "cancelled"],
    default: "pending"
  },
  note: { type: String, trim: true, maxlength: 1000 },
  reviewedAt: Date
}, { timestamps: true });

registrationSchema.index({ activity: 1, volunteer: 1 }, { unique: true });
registrationSchema.index({ volunteer: 1, createdAt: -1 });

export default mongoose.model("Registration", registrationSchema);
