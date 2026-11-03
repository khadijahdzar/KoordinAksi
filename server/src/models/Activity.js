import mongoose from "mongoose";

export const ACTIVITY_CATEGORIES = [
  "Donor Darah",
  "Bantuan Bencana",
  "Bakti Sosial",
  "Penghijauan",
  "Pendidikan",
  "Kesehatan",
  "Lainnya"
];

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  category: { type: String, enum: ACTIVITY_CATEGORIES, required: true },
  location: { type: String, required: true, trim: true, maxlength: 200 },
  date: { type: Date, required: true },
  endDate: Date,
  capacity: { type: Number, required: true, min: 1 },
  activeRegistrations: { type: Number, required: true, min: 0, default: 0 },
  imageUrl: { type: String, trim: true },
  status: { type: String, enum: ["draft", "published", "cancelled"], default: "published" },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true }
}, { timestamps: true });

activitySchema.index({ title: "text", description: "text", location: "text" });
activitySchema.index({ category: 1, date: 1, status: 1 });

export default mongoose.model("Activity", activitySchema);
