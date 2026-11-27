import mongoose from "mongoose";

let connectionPromise = null;

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});
mongoose.connection.on("disconnected", () => {
  connectionPromise = null;
  console.warn("MongoDB disconnected");
});

export async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }
  mongoose.set("strictQuery", true);
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose.connect(process.env.MONGO_URI)
    .then((connection) => {
      console.log(`MongoDB connected: ${connection.connection.host}`);
      return connection.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      throw error;
    });
  return connectionPromise;
}
