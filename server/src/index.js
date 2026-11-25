import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import app from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Selalu baca server/.env — tidak tergantung working directory terminal
dotenv.config({ path: path.join(__dirname, "../.env") });

const port = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");

await connectDB();
app.listen(port, () => {
  const midtransReady = Boolean(
    process.env.MIDTRANS_SERVER_KEY?.trim() && process.env.MIDTRANS_CLIENT_KEY?.trim()
  );
  console.log(`KoordinAksi API running on http://localhost:${port}`);
  console.log(`Midtrans gateway: ${midtransReady ? "ready" : "not configured"}`);
});
