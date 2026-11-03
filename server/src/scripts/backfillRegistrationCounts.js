import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Registration from "../models/Registration.js";

const capacityStatuses = ["pending", "approved", "attended"];

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not configured");
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  const counts = await Registration.aggregate([
    { $match: { status: { $in: capacityStatuses } } },
    { $group: { _id: "$activity", count: { $sum: 1 } } }
  ]);

  await Activity.updateMany({}, { $set: { activeRegistrations: 0 } });
  if (counts.length) {
    await Activity.bulkWrite(counts.map(({ _id, count }) => ({
      updateOne: {
        filter: { _id },
        update: { $set: { activeRegistrations: count } }
      }
    })));
  }

  console.log(`Registration counts synchronized for ${counts.length} activities.`);
} finally {
  await mongoose.disconnect();
}
