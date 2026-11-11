import { protect } from "./auth.js";

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Akses ditolak. Akun dengan peran admin diperlukan.",
      code: "ADMIN_REQUIRED"
    });
  }
  return next();
}

export const verifyAdminToken = [protect, requireAdmin];
