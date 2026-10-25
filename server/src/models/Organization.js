import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, trim: true, maxlength: 2000 },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  verified: { type: Boolean, default: false },
  verifiedAt: Date
}, { timestamps: true });

export default mongoose.model("Organization", organizationSchema);
