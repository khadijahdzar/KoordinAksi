import "dotenv/config";
import { connectDB } from "./config/db.js";
import app from "./app.js";
const port = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");

await connectDB();
app.listen(port, () => console.log(`KoordinAksi API running on http://localhost:${port}`));
