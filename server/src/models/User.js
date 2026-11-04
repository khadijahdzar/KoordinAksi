import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ["volunteer", "organization", "admin"], default: "volunteer" },
  phone: { type: String, trim: true, maxlength: 30 },
  city: { type: String, trim: true, maxlength: 100 },
  interests: { type: [String], default: [] },
  acceptedTerms: { type: Boolean, default: false },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" }
}, { timestamps: true });

userSchema.pre("save", async function hashPassword() {
  if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
