import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  const authorization = req.get("authorization");
  const match = typeof authorization === "string"
    ? authorization.trim().match(/^Bearer\s+(\S+)$/i)
    : null;
  const token = match?.[1];
  if (!token) {
    return res.status(401).json({
      message: "Autentikasi diperlukan. Kirim token dengan format Authorization: Bearer <token>.",
      code: "AUTHENTICATION_REQUIRED"
    });
  }
  if (!process.env.JWT_SECRET) return next(new Error("JWT_SECRET is not configured."));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || !/^[a-f\d]{24}$/i.test(payload.sub)) {
      return res.status(401).json({ message: "Token tidak berisi identitas pengguna yang valid.", code: "INVALID_TOKEN" });
    }
    const user = await User.findById(payload.sub).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Akun untuk sesi ini tidak ditemukan.", code: "INVALID_SESSION" });
    }
    req.user = user;
    return next();
  } catch (error) {
    if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)) {
      return res.status(401).json({
        message: error.name === "TokenExpiredError" ? "Token sesi sudah kedaluwarsa." : "Token sesi tidak valid.",
        code: error.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "INVALID_TOKEN"
      });
    }
    return next(error);
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Peran akun ini tidak memiliki akses untuk tindakan ini.",
        code: "INSUFFICIENT_ROLE"
      });
    }
    return next();
  };
}
