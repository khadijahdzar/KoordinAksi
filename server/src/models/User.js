import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  username: { type: String, trim: true, lowercase: true, maxlength: 30, sparse: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 8, select: false },
  role: { type: String, enum: ["volunteer", "organization", "admin"], default: "volunteer" },
  avatarUrl: { type: String, trim: true, maxlength: 500 },
  bio: { type: String, trim: true, maxlength: 500 },
  stats: {
    totalHours: { type: Number, min: 0, default: 0 },
    totalActions: { type: Number, min: 0, default: 0 },
    badgesCount: { type: Number, min: 0, default: 0 }
  },
  phone: { type: String, trim: true, maxlength: 30 },
  city: { type: String, trim: true, maxlength: 100 },
  interests: { type: [String], default: [] },
  acceptedTerms: { type: Boolean, default: false },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" }
}, { timestamps: true });

userSchema.pre("save", async function hashPassword() {
  if (this.password && this.isModified("password")) this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
