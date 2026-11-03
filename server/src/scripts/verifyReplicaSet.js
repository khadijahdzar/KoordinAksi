import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const expectedReplicaSet = "rs0";
const probeCollection = `transaction_probe_${randomUUID().replaceAll("-", "")}`;
const probeId = randomUUID();
let session;
let collectionCreated = false;

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not configured");
}

try {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });

  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (hello.setName !== expectedReplicaSet || hello.isWritablePrimary !== true) {
    throw new Error(
      `Expected writable replica set "${expectedReplicaSet}", received set "${hello.setName || "none"}".`
    );
  }

  await mongoose.connection.db.createCollection(probeCollection);
  collectionCreated = true;
  const collection = mongoose.connection.db.collection(probeCollection);
  session = await mongoose.startSession();

  await session.withTransaction(async () => {
    await collection.insertOne({ _id: probeId, checkedAt: new Date() }, { session });
  }, {
    readPreference: "primary",
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" }
  });

  const probe = await collection.findOne({ _id: probeId });
  if (!probe) {
    throw new Error("The transaction committed but its probe document was not found.");
  }

  console.log(`PASS: connected to database "${mongoose.connection.name}" on writable replica set "${hello.setName}".`);
  console.log("PASS: MongoDB committed a session transaction successfully.");
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (session) await session.endSession();
  if (collectionCreated && mongoose.connection.readyState === 1) {
    await mongoose.connection.db.dropCollection(probeCollection).catch((error) => {
      if (error.code !== 26) throw error;
    });
  }
  await mongoose.disconnect();
}
