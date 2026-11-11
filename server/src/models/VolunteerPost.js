import mongoose from "mongoose";

const volunteerPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true, trim: true, maxlength: 2000 },
  imageUrl: { type: String, trim: true, maxlength: 500 },
  actionTitle: { type: String, trim: true, maxlength: 160 },
  likesCount: { type: Number, min: 0, default: 0 }
}, { timestamps: true });

volunteerPostSchema.index({ createdAt: -1 });

export default mongoose.model("VolunteerPost", volunteerPostSchema);