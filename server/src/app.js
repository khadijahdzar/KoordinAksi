import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import activityRoutes from "./routes/activities.js";
import registrationRoutes from "./routes/registrations.js";
import organizationRoutes from "./routes/organizations.js";
import organizationFollowRoutes from "./routes/organizationFollow.js";
import adminRoutes from "./routes/adminRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import leaderboardRoutes from "./routes/leaderboards.js";
import orgRoutes from "./routes/orgRoutes.js";
import paymentRoutes from "./routes/payments.js";
import { errorHandler, notFound } from "./middleware/errors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);

function normalizeOrigin(value) {
  if (!value || typeof value !== "string") return null;
  return value.trim().replace(/\/+$/, "");
}

const configuredOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URLS
]
  .filter(Boolean)
  .flatMap((value) => String(value).split(","))
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = configuredOrigins.length
  ? configuredOrigins
  : ["https://koordinaksi.netlify.app"];

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/organizations", organizationFollowRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/leaderboards", leaderboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/volunteers", volunteerRoutes);
app.use("/api/v1/organizations", orgRoutes);
app.use("/api/payments", paymentRoutes);

// Production: serve Vite build when present (monorepo / single Railway service)
const clientDist = path.join(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(clientDist, "index.html"), (err) => {
      if (err) next();
    });
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
