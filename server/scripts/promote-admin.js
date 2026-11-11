import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.js";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: node --env-file=server/.env server/scripts/promote-admin.js <account-email>");
  process.exitCode = 1;
} else {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured.");
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOneAndUpdate(
      { email },
      { $set: { role: "admin" } },
      { new: true, runValidators: true }
    ).select("email role");

    if (!user) throw new Error(`No account found for ${email}.`);
    console.log(`Admin role granted to ${user.email}.`);
  } catch (error) {
    console.error(`Unable to grant admin role: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  }
}
