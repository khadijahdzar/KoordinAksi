import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import activityRoutes from "./routes/activities.js";
import registrationRoutes from "./routes/registrations.js";
import organizationRoutes from "./routes/organizations.js";
import { errorHandler, notFound } from "./middleware/errors.js";

const app = express();
const port = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/organizations", organizationRoutes);
app.use(notFound);
app.use(errorHandler);

await connectDB();
app.listen(port, () => console.log(`KoordinAksi API running on http://localhost:${port}`));
