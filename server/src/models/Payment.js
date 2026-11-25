import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, trim: true },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", required: true },
  volunteer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  packageId: { type: String, enum: ["regular", "supporter"], required: true },
  packageLabel: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 1000 },
  status: {
    type: String,
    enum: ["pending", "paid", "failed", "expired", "cancelled"],
    default: "pending"
  },
  snapToken: { type: String, trim: true },
  midtransTransactionId: { type: String, trim: true },
  paidAt: Date,
  registration: { type: mongoose.Schema.Types.ObjectId, ref: "Registration" },
  rawNotification: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

paymentSchema.index({ activity: 1, status: 1, createdAt: -1 });
paymentSchema.index({ volunteer: 1, createdAt: -1 });
paymentSchema.index({ status: 1, paidAt: -1 });

export default mongoose.model("Payment", paymentSchema);
