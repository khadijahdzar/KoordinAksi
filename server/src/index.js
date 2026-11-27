import { connectDB } from "./config/db.js";
import app from "./app.js";

const port = Number(process.env.PORT) || 5000;
const host = process.env.HOST || "0.0.0.0";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");

try {
  await connectDB();
} catch (error) {
  console.error("Failed to connect to MongoDB:", error.message);
  process.exit(1);
}

app.listen(port, host, () => {
  const midtransReady = Boolean(
    process.env.MIDTRANS_SERVER_KEY?.trim() && process.env.MIDTRANS_CLIENT_KEY?.trim()
  );
  console.log(`KoordinAksi API listening on http://${host}:${port}`);
  console.log(`Midtrans gateway: ${midtransReady ? "ready" : "not configured"}`);
});
