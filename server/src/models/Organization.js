import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, trim: true, maxlength: 2000 },
  focusCategory: { type: String, trim: true, maxlength: 100 },
  logoUrl: { type: String, trim: true, maxlength: 500 },
  legalNumber: { type: String, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  picTitle: { type: String, trim: true, maxlength: 100 },
  address: { type: String, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  verified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  stats: {
    activeActionsCount: { type: Number, min: 0, default: 0 },
    totalVolunteers: { type: Number, min: 0, default: 0 },
    impactScore: { type: Number, min: 0, default: 0 }
  },
  verifiedAt: Date
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

organizationSchema.virtual("orgName").get(function getOrgName() { return this.name; })
  .set(function setOrgName(value) { this.name = value; });
organizationSchema.virtual("verifiedStatus").get(function getVerifiedStatus() { return this.verified; })
  .set(function setVerifiedStatus(value) { this.verified = value; });

export default mongoose.model("Organization", organizationSchema);
